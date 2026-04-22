import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";

export type BusinessSettings = {
  business_name: string;
  whatsapp: string;
  open_hour: number;
  close_hour: number;
  description: string;
  primary_color: string;
  instagram: string;
  facebook: string;
};

const DEFAULTS: BusinessSettings = {
  business_name: "Mi Negocio",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_E164 ?? "",
  open_hour: 10,
  close_hour: 20,
  description: "",
  primary_color: "#14F195",
  instagram: "",
  facebook: "",
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
      .select("name, settings")
      .eq("slug", slug)
      .single();

    if (!data) return { ...DEFAULTS };

    const s = (data.settings ?? {}) as Record<string, unknown>;

    return {
      business_name: (data.name as string)              ?? DEFAULTS.business_name,
      whatsapp:      (s.whatsapp as string)              ?? DEFAULTS.whatsapp,
      open_hour:     (s.open_hour as number)             ?? DEFAULTS.open_hour,
      close_hour:    (s.close_hour as number)            ?? DEFAULTS.close_hour,
      description:   (s.description as string)           ?? DEFAULTS.description,
      primary_color: (s.primary_color as string)         ?? DEFAULTS.primary_color,
      instagram:     (s.instagram as string)              ?? DEFAULTS.instagram,
      facebook:      (s.facebook as string)               ?? DEFAULTS.facebook,
    };
  } catch {
    return { ...DEFAULTS };
  }
}
