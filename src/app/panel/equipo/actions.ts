"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { requirePanelAuth } from "@/lib/panel-auth";

const PATH = "/panel/equipo";

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  color: string;
  phone: string | null;
  is_active: boolean;
  sort_order: number;
  service_ids: string[];
};

export async function createStaffAction(input: {
  name: string;
  role: string;
  color: string;
  phone: string | null;
  service_ids: string[];
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requirePanelAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const name = input.name.trim();
    if (name.length < 2) return { ok: false, error: "El nombre es muy corto." };

    const tenant = await getTenantSlug();
    const { data, error } = await admin
      .from("bookido_staff")
      .insert({ tenant_slug: tenant, name, role: input.role, color: input.color, phone: input.phone || null })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Error al crear." };

    // Assign services
    if (input.service_ids.length > 0) {
      await admin.from("bookido_staff_services").insert(
        input.service_ids.map((sid) => ({ staff_id: data.id, service_id: sid }))
      );
    }

    revalidatePath(PATH);
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateStaffAction(
  id: string,
  input: { name: string; role: string; color: string; phone: string | null; service_ids: string[] }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requirePanelAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const name = input.name.trim();
    if (name.length < 2) return { ok: false, error: "El nombre es muy corto." };

    const tenant = await getTenantSlug();
    const { error } = await admin
      .from("bookido_staff")
      .update({ name, role: input.role, color: input.color, phone: input.phone || null })
      .eq("id", id)
      .eq("tenant_slug", tenant);

    if (error) return { ok: false, error: error.message };

    // Replace services
    await admin.from("bookido_staff_services").delete().eq("staff_id", id);
    if (input.service_ids.length > 0) {
      await admin.from("bookido_staff_services").insert(
        input.service_ids.map((sid) => ({ staff_id: id, service_id: sid }))
      );
    }

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function toggleStaffAction(
  id: string,
  is_active: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requirePanelAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const tenant = await getTenantSlug();
    const { error } = await admin
      .from("bookido_staff")
      .update({ is_active })
      .eq("id", id)
      .eq("tenant_slug", tenant);

    if (error) return { ok: false, error: error.message };
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteStaffAction(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requirePanelAuth();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const tenant = await getTenantSlug();
    const { error } = await admin
      .from("bookido_staff")
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
