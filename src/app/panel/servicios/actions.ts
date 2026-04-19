"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createSsrClient } from "@/lib/supabase/ssr";
import { getTenantSlug } from "@/lib/tenant";

async function requireAuth() {
  const supabase = await createSsrClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

const PATH = "/panel/servicios";

export async function toggleServiceAction(
  id: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const tenant = await getTenantSlug();
    const { error } = await admin
      .from("bookido_services")
      .update({ active })
      .eq("id", id)
      .eq("tenant_slug", tenant);

    if (error) return { ok: false, error: error.message };
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function createServiceAction(input: {
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number;
  sort_order: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const name = input.name.trim();
    if (name.length < 2) return { ok: false, error: "El nombre es muy corto." };
    if (input.duration_minutes < 5 || input.duration_minutes > 480)
      return { ok: false, error: "Duración debe estar entre 5 y 480 minutos." };

    const tenant = await getTenantSlug();
    const row: Record<string, unknown> = {
      tenant_slug: tenant,
      name,
      duration_minutes: input.duration_minutes,
      sort_order: input.sort_order,
      active: true,
    };
    if (input.description !== null) row.description = input.description;
    if (input.price !== null) row.price = input.price;
    const { error } = await admin.from("bookido_services").insert(row);

    if (error) return { ok: false, error: error.message };
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateServiceAction(
  id: string,
  input: { name: string; description: string | null; price: number | null; duration_minutes: number; sort_order: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const name = input.name.trim();
    if (name.length < 2) return { ok: false, error: "El nombre es muy corto." };
    if (input.duration_minutes < 5 || input.duration_minutes > 480)
      return { ok: false, error: "Duración debe estar entre 5 y 480 minutos." };

    const tenant = await getTenantSlug();
    const updates: Record<string, unknown> = {
      name,
      duration_minutes: input.duration_minutes,
      sort_order: input.sort_order,
    };
    if (input.description !== undefined) updates.description = input.description;
    if (input.price !== undefined) updates.price = input.price;
    const { error } = await admin
      .from("bookido_services")
      .update(updates)
      .eq("id", id)
      .eq("tenant_slug", tenant);

    if (error) return { ok: false, error: error.message };
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteServiceAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const tenant = await getTenantSlug();
    const { error } = await admin
      .from("bookido_services")
      .delete()
      .eq("id", id)
      .eq("tenant_slug", tenant);

    if (error) return { ok: false, error: error.message };
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function reorderServiceAction(
  idA: string,
  idB: string,
  orderA: number,
  orderB: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const tenant = await getTenantSlug();
    const [r1, r2] = await Promise.all([
      admin.from("bookido_services").update({ sort_order: orderB }).eq("id", idA).eq("tenant_slug", tenant),
      admin.from("bookido_services").update({ sort_order: orderA }).eq("id", idB).eq("tenant_slug", tenant),
    ]);

    if (r1.error) return { ok: false, error: r1.error.message };
    if (r2.error) return { ok: false, error: r2.error.message };
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
