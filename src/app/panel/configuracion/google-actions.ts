"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createSsrClient } from "@/lib/supabase/ssr";
import { getTenantSlug } from "@/lib/tenant";

async function requireAuth() {
  const supabase = await createSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

/** Toggles the sync_enabled flag for a tenant's Google Calendar connection. */
export async function toggleGoogleSyncAction(
  enabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado" };

    const tenantSlug = await getTenantSlug();
    const { error } = await admin
      .from("google_calendar_connections")
      .update({ sync_enabled: enabled, updated_at: new Date().toISOString() })
      .eq("tenant_slug", tenantSlug);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/panel/configuracion");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
