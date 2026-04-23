"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { requirePanelAuth } from "@/lib/panel-auth";

export async function saveClientDateAction(input: {
  customerEmail: string;
  customerName: string;
  dateType: string;
  label: string | null;
  month: number;
  day: number;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await requirePanelAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const tenant = await getTenantSlug();

    const { error } = await admin
      .from("bookido_client_dates")
      .upsert(
        {
          tenant_slug: tenant,
          customer_email: input.customerEmail.toLowerCase(),
          customer_name: input.customerName,
          date_type: input.dateType,
          label: input.label,
          month: input.month,
          day: input.day,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_slug,customer_email,date_type" }
      );

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/panel/clientes/${encodeURIComponent(input.customerEmail)}`);
    revalidatePath("/panel");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteClientDateAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requirePanelAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const tenant = await getTenantSlug();
    const { error } = await admin
      .from("bookido_client_dates")
      .delete()
      .eq("id", id)
      .eq("tenant_slug", tenant);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
