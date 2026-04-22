"use server";

import { revalidatePath } from "next/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { verifySessionToken, ADMIN_COOKIE } from "@/lib/admin-session";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) throw new Error("No autorizado");
}

export async function updatePlanPriceAction(
  planId: string,
  priceRd: number | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, error: "Supabase no configurado." };

    const { error } = await admin
      .from("bookido_plans")
      .update({ price_rd: priceRd })
      .eq("id", planId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/planes");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
