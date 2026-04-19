"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifySessionToken, ADMIN_COOKIE } from "@/lib/admin-session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export type LandingFormData = {
  is_active: boolean;
  template: string;
  business_name: string;
  tagline: string;
  description: string;
  whatsapp: string;
  address: string;
  schedule: string;
  hero_color: string;
  photo_url_1: string;
  photo_url_2: string;
  photo_url_3: string;
  instagram_url: string;
  tiktok_url: string;
  facebook_url: string;
  show_booking_button: boolean;
  custom_cta_text: string;
};

export async function saveLandingAction(
  slug: string,
  data: LandingFormData
): Promise<{ ok: boolean; message: string }> {
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE)?.value;
  if (!token || !(await verifySessionToken(token))) {
    return { ok: false, message: "No autorizado" };
  }

  const admin = createServiceSupabaseClient();
  if (!admin) return { ok: false, message: "Error de configuración" };

  // Sanitise: convert empty strings to null for optional fields
  const nullIfEmpty = (v: string) => (v.trim() === "" ? null : v.trim());

  const { error } = await admin.from("bookido_landings").upsert(
    {
      tenant_slug: slug,
      is_active: data.is_active,
      template: data.template,
      business_name: data.business_name.trim() || slug,
      tagline: nullIfEmpty(data.tagline),
      description: nullIfEmpty(data.description),
      whatsapp: nullIfEmpty(data.whatsapp),
      address: nullIfEmpty(data.address),
      schedule: nullIfEmpty(data.schedule),
      hero_color: data.hero_color || "#be185d",
      photo_url_1: nullIfEmpty(data.photo_url_1),
      photo_url_2: nullIfEmpty(data.photo_url_2),
      photo_url_3: nullIfEmpty(data.photo_url_3),
      instagram_url: nullIfEmpty(data.instagram_url),
      tiktok_url: nullIfEmpty(data.tiktok_url),
      facebook_url: nullIfEmpty(data.facebook_url),
      show_booking_button: data.show_booking_button,
      custom_cta_text: data.custom_cta_text.trim() || "Reservar cita",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_slug" }
  );

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/admin/clientes/${slug}/landing`);
  revalidatePath("/");
  return { ok: true, message: "Cambios guardados correctamente" };
}
