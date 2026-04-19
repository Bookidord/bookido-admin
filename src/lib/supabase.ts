import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getTenantSlug } from "@/lib/tenant";

const SERVICES_TABLE = "bookido_services";

export function createServerSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function createBrowserSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export type LandingServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
};

/**
 * Servicios activos del tenant para la landing (lectura con anon key + RLS público de lectura).
 */
export async function getLandingServices(): Promise<LandingServiceRow[]> {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from(SERVICES_TABLE)
      .select("id, name, duration_minutes")
      .eq("tenant_slug", await getTenantSlug())
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) return [];
    return data as LandingServiceRow[];
  } catch {
    return [];
  }
}
