"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { requirePanelAuth } from "@/lib/panel-auth";

export type ProductInput = {
  id?: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  active: boolean;
  sort_order: number;
};

export async function saveProductAction(input: ProductInput): Promise<{ ok: boolean; error?: string }> {
  try {
    await requirePanelAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const tenant = await getTenantSlug();

    if (input.id) {
      const { error } = await admin.from("bookido_products")
        .update({ name: input.name, description: input.description, price: input.price, photo_url: input.photo_url, active: input.active, sort_order: input.sort_order, updated_at: new Date().toISOString() })
        .eq("id", input.id).eq("tenant_slug", tenant);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await admin.from("bookido_products")
        .insert({ tenant_slug: tenant, name: input.name, description: input.description, price: input.price, photo_url: input.photo_url, active: input.active, sort_order: input.sort_order });
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath("/panel/productos");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteProductAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requirePanelAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const tenant = await getTenantSlug();
    const { error } = await admin.from("bookido_products").delete().eq("id", id).eq("tenant_slug", tenant);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/panel/productos");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function toggleProductAction(id: string, active: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    await requirePanelAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };
    const tenant = await getTenantSlug();
    const { error } = await admin.from("bookido_products").update({ active, updated_at: new Date().toISOString() }).eq("id", id).eq("tenant_slug", tenant);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/panel/productos");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
