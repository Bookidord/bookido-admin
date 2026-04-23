"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { requirePanelAuth } from "@/lib/panel-auth";

export type LandingInput = {
  is_active: boolean;
  template: string;
  business_name: string;
  tagline: string | null;
  description: string | null;
  hero_color: string;
  custom_cta_text: string;
  whatsapp: string | null;
  address: string | null;
  schedule: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
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
};

export async function saveLandingAction(input: LandingInput): Promise<{ ok: boolean; error?: string }> {
  try {
    await requirePanelAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const tenant = await getTenantSlug();

    const { error } = await admin
      .from("bookido_landings")
      .upsert(
        { ...input, tenant_slug: tenant, updated_at: new Date().toISOString() },
        { onConflict: "tenant_slug" }
      );

    if (error) return { ok: false, error: error.message };

    revalidatePath("/panel/landing");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
