"use server";

import { cookies } from "next/headers";
import { createSsrClient } from "@/lib/supabase/ssr";
import { getTenantSlug } from "@/lib/tenant";

/**
 * Verifies panel access: either a real Supabase session OR
 * a superadmin impersonation cookie (__bookido_imp).
 * Throws "No autorizado" if neither is present.
 */
export async function requirePanelAuth(): Promise<void> {
  // 1. Check impersonation cookie
  const cookieStore = await cookies();
  const imp = cookieStore.get("__bookido_imp")?.value;
  if (imp) {
    const tenantSlug = await getTenantSlug();
    if (imp === tenantSlug) return;
  }

  // 2. Check real Supabase session
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}
