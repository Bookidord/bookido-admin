import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";

export type BusinessSettings = {
  business_name: string;
  whatsapp: string;
  open_hour: number;
  close_hour: number;
  description: string;
  primary_color: string;
};

const DEFAULTS: BusinessSettings = {
  business_name: "Mi Negocio",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_E164 ?? "",
  open_hour: 10,
  close_hour: 20,
  description: "",
  primary_color: "#14F195",
};

/**
 * Reads business settings from the tenants table for the current tenant.
 * Falls back to env var defaults if the tenant row doesn't exist yet.
 */
export async function getSettings(): Promise<BusinessSettings> {
  try {
    const admin = createServiceSupabaseClient();
    if (!admin) return { ...DEFAULTS };

    const slug = await getTenantSlug();
    const { data } = await admin
      .from("tenants")
      .select("business_name, whatsapp, open_hour, close_hour, description, primary_color")
      .eq("slug", slug)
      .single();

    if (!data) return { ...DEFAULTS };

    return {
      business_name: data.business_name ?? DEFAULTS.business_name,
      whatsapp:       data.whatsapp      ?? DEFAULTS.whatsapp,
      open_hour:      data.open_hour     ?? DEFAULTS.open_hour,
      close_hour:     data.close_hour    ?? DEFAULTS.close_hour,
      description:    data.description   ?? DEFAULTS.description,
      primary_color:  data.primary_color ?? DEFAULTS.primary_color,
    };
  } catch {
    return { ...DEFAULTS };
  }
}
