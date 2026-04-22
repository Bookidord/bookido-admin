"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import type { BusinessSettings } from "@/lib/settings";
import { requirePanelAuth } from "@/lib/panel-auth";

const PATHS = ["/panel/configuracion", "/reserva"];

const requireAuth = requirePanelAuth;

// ─── Tab 1: Negocio ────────────────────────────────────────────────────────────
export async function saveNegocioAction(
  data: BusinessSettings & { logo_url?: string; address?: string; legal_name?: string; tax_id?: string; hero_copy?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const slug = await getTenantSlug();
    const { error } = await admin.from("tenants").update({
      business_name: data.business_name,
      whatsapp:      data.whatsapp,
      description:   data.description,
      primary_color: data.primary_color,
      logo_url:      data.logo_url   ?? null,
      address:       data.address    ?? null,
      legal_name:    data.legal_name ?? null,
      tax_id:        data.tax_id     ?? null,
      hero_copy:     data.hero_copy  ?? null,
    }).eq("slug", slug);
    if (error) return { ok: false, error: error.message };
    PATHS.forEach(p => revalidatePath(p));
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// Keep backwards-compat alias used by old ConfiguracionClient
export const saveSettingsAction = saveNegocioAction;

// ─── Tab: Landing ──────────────────────────────────────────────────────────────
export type LandingConfig = {
  photo_url_1: string | null;
  photo_url_2: string | null;
  photo_url_3: string | null;
  photo_url_4: string | null;
  photo_url_5: string | null;
  photo_url_6: string | null;
  owner_name: string | null;
  owner_bio: string | null;
  owner_photo_url: string | null;
  owner_video_url: string | null;
  diploma_urls: string[] | null;
  stats_years: number | null;
  stats_clients: number | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
};

export async function saveLandingAction(
  data: LandingConfig,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const slug = await getTenantSlug();

    // Store extended config in Supabase Storage (photos, bio, diplomas, stats)
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: "application/json" });
    const { error } = await admin.storage
      .from("bookido-media")
      .upload(`config/${slug}.json`, blob, { contentType: "application/json", upsert: true });

    if (error) return { ok: false, error: error.message };

    // Save social media fields to bookido_landings table
    await admin.from("bookido_landings").update({
      instagram_url: data.instagram_url || null,
      tiktok_url:    data.tiktok_url    || null,
      facebook_url:  data.facebook_url  || null,
    }).eq("tenant_slug", slug);

    revalidatePath("/");
    revalidatePath("/panel/configuracion");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// ─── Tab 2: Horarios ───────────────────────────────────────────────────────────
export type DayHours = {
  day_of_week: number;
  is_open: boolean;
  slots: { open: string; close: string }[];
};

export async function saveHorariosAction(
  days: DayHours[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const slug = await getTenantSlug();

    for (const d of days) {
      const { error } = await admin.from("bookido_business_hours").upsert({
        tenant_slug: slug,
        day_of_week: d.day_of_week,
        is_open: d.is_open,
        slots: d.slots,
      }, { onConflict: "tenant_slug,day_of_week" });
      if (error) return { ok: false, error: error.message };
    }
    PATHS.forEach(p => revalidatePath(p));
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export type SpecialDay = { date: string; is_closed: boolean; reason: string; reason_detail?: string };

export async function saveSpecialDayAction(
  day: SpecialDay,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const slug = await getTenantSlug();
    const { error } = await admin.from("bookido_special_days").upsert({
      tenant_slug: slug, ...day,
    }, { onConflict: "tenant_slug,date" });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/panel/configuracion");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function deleteSpecialDayAction(
  date: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const slug = await getTenantSlug();
    const { error } = await admin.from("bookido_special_days").delete()
      .eq("tenant_slug", slug).eq("date", date);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/panel/configuracion");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// ─── Tab 4: Políticas de reserva ───────────────────────────────────────────────
export type BookingPolicies = {
  min_advance_hours: number;
  max_advance_days: number;
  cancellation_policy: string;
  require_deposit: boolean;
  deposit_amount: number;
};

export async function savePoliciesAction(
  data: BookingPolicies,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const slug = await getTenantSlug();
    const { error } = await admin.from("bookido_booking_policies").upsert({
      tenant_slug: slug, ...data,
    }, { onConflict: "tenant_slug" });
    if (error) return { ok: false, error: error.message };
    PATHS.forEach(p => revalidatePath(p));
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// ─── Tab 5: Mensajes ───────────────────────────────────────────────────────────
export type MessageTemplate = {
  key: string;
  channel: string;
  enabled: boolean;
  subject?: string;
  body: string;
};

export async function saveTemplateAction(
  tpl: MessageTemplate,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const slug = await getTenantSlug();
    const { error } = await admin.from("bookido_message_templates").upsert({
      tenant_slug: slug, ...tpl,
    }, { onConflict: "tenant_slug,key" });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/panel/configuracion");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}
