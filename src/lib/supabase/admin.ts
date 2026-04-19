import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con rol de servicio: solo importar desde Server Actions o Route Handlers.
 * Nunca uses esta clave en el navegador.
 */
export function createServiceSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
