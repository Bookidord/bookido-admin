import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createSsrClient } from "@/lib/supabase/ssr";
import { exchangeCode, setupPushNotifications } from "@/lib/google-calendar";
import { encryptToken } from "@/lib/token-crypto";

/** GET /api/google/callback
 *  Handles the OAuth2 redirect from Google. Saves encrypted tokens.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const basePath =
    process.env.NODE_ENV === "production"
      ? "/panel/configuracion"
      : "/panel/configuracion";

  if (errorParam || !code || !state) {
    return NextResponse.redirect(
      new URL(`${basePath}?gcal=error`, request.url)
    );
  }

  // Decode tenant slug from state
  let tenantSlug: string;
  try {
    tenantSlug = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return NextResponse.redirect(new URL(`${basePath}?gcal=error`, request.url));
  }

  // Verify the user is authenticated and owns this tenant
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const tokens = await exchangeCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL(`${basePath}?gcal=error`, request.url)
      );
    }

    // Get the connected Google account's email
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();
    const googleEmail = profile.email ?? "";

    const admin = createServiceSupabaseClient();
    if (!admin) throw new Error("Supabase unavailable");

    await admin.from("google_calendar_connections").upsert(
      {
        tenant_slug: tenantSlug,
        google_user_email: googleEmail,
        access_token_enc: encryptToken(tokens.access_token),
        refresh_token_enc: encryptToken(tokens.refresh_token),
        calendar_id: "primary",
        sync_enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_slug" }
    );

    // Set up push notifications (non-blocking, fails gracefully)
    setupPushNotifications(tenantSlug).catch(console.error);

    return NextResponse.redirect(
      new URL(`${basePath}?gcal=connected`, request.url)
    );
  } catch (err) {
    console.error("[gcal callback]", err);
    return NextResponse.redirect(
      new URL(`${basePath}?gcal=error`, request.url)
    );
  }
}
