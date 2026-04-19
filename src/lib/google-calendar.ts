/**
 * Google Calendar integration helpers.
 * All functions are server-only (imported only from server actions / route handlers).
 */

import { google } from "googleapis";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { encryptToken, decryptToken } from "@/lib/token-crypto";

const TIMEZONE = "America/Santo_Domingo";

// ─── OAuth2 client factory ────────────────────────────────────────────────────

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/** Returns the Google consent-screen URL with the tenant slug encoded as state. */
export function getGoogleAuthUrl(tenantSlug: string): string {
  const oauth2 = createOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force refresh_token every time
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
      "openid",
      "email",
      "profile",
    ],
    state: Buffer.from(tenantSlug).toString("base64url"),
  });
}

/** Exchanges an authorization code for access + refresh tokens. */
export async function exchangeCode(code: string) {
  const oauth2 = createOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

// ─── Authenticated client per tenant ─────────────────────────────────────────

type CalendarClient = {
  calendar: ReturnType<typeof google.calendar>;
  calendarId: string;
  tenantSlug: string;
};

/**
 * Builds an authenticated Google Calendar client for a tenant.
 * Returns null if the tenant has no connection or sync is disabled.
 * Auto-persists refreshed access tokens.
 */
export async function getCalendarClient(
  tenantSlug: string
): Promise<CalendarClient | null> {
  const admin = createServiceSupabaseClient();
  if (!admin) return null;

  const { data: conn } = await admin
    .from("google_calendar_connections")
    .select("access_token_enc, refresh_token_enc, calendar_id, sync_enabled")
    .eq("tenant_slug", tenantSlug)
    .maybeSingle();

  if (!conn || !conn.sync_enabled) return null;

  let accessToken: string;
  let refreshToken: string;
  try {
    accessToken = decryptToken(conn.access_token_enc);
    refreshToken = decryptToken(conn.refresh_token_enc);
  } catch {
    return null;
  }

  const oauth2 = createOAuth2Client();
  oauth2.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  // Persist new access token whenever googleapis auto-refreshes
  oauth2.on("tokens", async (newTokens) => {
    const updates: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };
    if (newTokens.access_token) {
      updates.access_token_enc = encryptToken(newTokens.access_token);
    }
    if (newTokens.refresh_token) {
      updates.refresh_token_enc = encryptToken(newTokens.refresh_token);
    }
    await admin
      .from("google_calendar_connections")
      .update(updates)
      .eq("tenant_slug", tenantSlug);
  });

  return {
    calendar: google.calendar({ version: "v3", auth: oauth2 }),
    calendarId: conn.calendar_id ?? "primary",
    tenantSlug,
  };
}

// ─── Outbound sync helpers ────────────────────────────────────────────────────

/**
 * Creates a calendar event and returns the Google event ID.
 * Returns null silently on any error (never throws).
 */
export async function createCalendarEvent(
  tenantSlug: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startISO: string;
    endISO: string;
  }
): Promise<string | null> {
  try {
    const client = await getCalendarClient(tenantSlug);
    if (!client) return null;

    const res = await client.calendar.events.insert({
      calendarId: client.calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: { dateTime: event.startISO, timeZone: TIMEZONE },
        end: { dateTime: event.endISO, timeZone: TIMEZONE },
      },
    });
    return res.data.id ?? null;
  } catch (err) {
    console.error(`[gcal] createCalendarEvent(${tenantSlug}):`, err);
    await handleTokenFailure(tenantSlug, err);
    return null;
  }
}

/** Updates an existing Google Calendar event. Silent on error. */
export async function updateCalendarEvent(
  tenantSlug: string,
  googleEventId: string,
  patch: {
    summary?: string;
    description?: string;
    startISO?: string;
    endISO?: string;
  }
): Promise<void> {
  try {
    const client = await getCalendarClient(tenantSlug);
    if (!client) return;

    const body: Record<string, unknown> = {};
    if (patch.summary) body.summary = patch.summary;
    if (patch.description) body.description = patch.description;
    if (patch.startISO) body.start = { dateTime: patch.startISO, timeZone: TIMEZONE };
    if (patch.endISO) body.end = { dateTime: patch.endISO, timeZone: TIMEZONE };

    await client.calendar.events.patch({
      calendarId: client.calendarId,
      eventId: googleEventId,
      requestBody: body,
    });
  } catch (err) {
    console.error(`[gcal] updateCalendarEvent(${tenantSlug}, ${googleEventId}):`, err);
    await handleTokenFailure(tenantSlug, err);
  }
}

/** Deletes a Google Calendar event. Silent on error. */
export async function deleteCalendarEvent(
  tenantSlug: string,
  googleEventId: string
): Promise<void> {
  try {
    const client = await getCalendarClient(tenantSlug);
    if (!client) return;

    await client.calendar.events.delete({
      calendarId: client.calendarId,
      eventId: googleEventId,
    });
  } catch (err) {
    // 404 = already deleted, 410 = gone — both are fine
    const status = (err as { code?: number }).code;
    if (status !== 404 && status !== 410) {
      console.error(`[gcal] deleteCalendarEvent(${tenantSlug}, ${googleEventId}):`, err);
      await handleTokenFailure(tenantSlug, err);
    }
  }
}

// ─── Inbound sync helpers ─────────────────────────────────────────────────────

/**
 * Fetches all calendar events in a time window.
 * Returns only events that are NOT Bookido-created (by checking google_event_id in bookings).
 */
export async function syncExternalEventsForTenant(
  tenantSlug: string
): Promise<void> {
  try {
    const admin = createServiceSupabaseClient();
    if (!admin) return;

    const client = await getCalendarClient(tenantSlug);
    if (!client) return;

    const now = new Date();
    const timeMin = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
    const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ahead

    const res = await client.calendar.events.list({
      calendarId: client.calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      maxResults: 500,
    });

    const googleEvents = (res.data.items ?? []).filter(
      (e) => e.id && e.start?.dateTime && e.end?.dateTime
    );

    // Find which event IDs belong to Bookido bookings (skip those)
    const googleIds = googleEvents.map((e) => e.id!);

    const { data: ownedRows } = await admin
      .from("bookido_bookings")
      .select("google_event_id")
      .eq("tenant_slug", tenantSlug)
      .in("google_event_id", googleIds);

    const ownedIds = new Set((ownedRows ?? []).map((r) => r.google_event_id));

    const externalEvents = googleEvents.filter((e) => !ownedIds.has(e.id!));

    // Upsert external events into blocked slots
    if (externalEvents.length > 0) {
      await admin.from("external_blocked_slots").upsert(
        externalEvents.map((e) => ({
          tenant_slug: tenantSlug,
          google_event_id: e.id!,
          starts_at: e.start!.dateTime!,
          ends_at: e.end!.dateTime!,
          summary: e.summary ?? null,
        })),
        { onConflict: "tenant_slug,google_event_id" }
      );
    }

    // Delete any external slots whose Google event no longer appears
    const allFetchedIds = googleEvents.map((e) => e.id!);
    if (allFetchedIds.length > 0) {
      await admin
        .from("external_blocked_slots")
        .delete()
        .eq("tenant_slug", tenantSlug)
        .gte("starts_at", timeMin)
        .lte("starts_at", timeMax)
        .not("google_event_id", "in", `(${allFetchedIds.map((id) => `"${id}"`).join(",")})`);
    }

    // Update last_sync_at
    await admin
      .from("google_calendar_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("tenant_slug", tenantSlug);
  } catch (err) {
    console.error(`[gcal] syncExternalEventsForTenant(${tenantSlug}):`, err);
    await handleTokenFailure(tenantSlug, err);
  }
}

/** Sets up Google Calendar push notifications for a tenant. */
export async function setupPushNotifications(
  tenantSlug: string
): Promise<void> {
  try {
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "bookido.online";
    const webhookUrl = `https://${baseDomain}/api/google/webhook`;

    const client = await getCalendarClient(tenantSlug);
    if (!client) return;

    const channelId = `bookido-${tenantSlug}-${Date.now()}`;

    await client.calendar.events.watch({
      calendarId: client.calendarId,
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
        token: tenantSlug, // returned as X-Goog-Channel-Token on each push
        params: { ttl: "604800" }, // 7 days; renew via cron
      },
    });

    console.log(`[gcal] Push notifications enabled for ${tenantSlug} → ${webhookUrl}`);
  } catch (err) {
    // Non-fatal: polling still works
    console.error(`[gcal] setupPushNotifications(${tenantSlug}):`, err);
  }
}

// ─── Error handling ───────────────────────────────────────────────────────────

async function handleTokenFailure(tenantSlug: string, err: unknown): Promise<void> {
  const msg = String(err);
  const isAuthError =
    msg.includes("invalid_grant") ||
    msg.includes("Token has been expired") ||
    msg.includes("invalid_client") ||
    (err as { code?: number }).code === 401;

  if (isAuthError) {
    const admin = createServiceSupabaseClient();
    if (admin) {
      await admin
        .from("google_calendar_connections")
        .update({ sync_enabled: false, updated_at: new Date().toISOString() })
        .eq("tenant_slug", tenantSlug);
      console.warn(`[gcal] Disabled sync for ${tenantSlug} — token invalid. User must reconnect.`);
    }
  }
}
