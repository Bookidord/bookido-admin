"use server";

import { createHash } from "crypto";
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

function hashPassword(pw: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "dev";
  return createHash("sha256").update(pw + secret).digest("hex");
}

export async function changeAdminPasswordAction(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  try {
    await requireAdmin();

    const newPassword = (formData.get("new_password") as string) ?? "";
    const confirm = (formData.get("confirm_password") as string) ?? "";

    if (newPassword.length < 8)
      return { ok: false, message: "La contraseña debe tener al menos 8 caracteres." };
    if (newPassword !== confirm)
      return { ok: false, message: "Las contraseñas no coinciden." };

    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, message: "Supabase no configurado." };

    const { error } = await admin
      .from("bookido_admin_config")
      .update({ password_hash: hashPassword(newPassword) })
      .eq("id", 1);

    if (error) return { ok: false, message: error.message };

    revalidatePath("/admin/configuracion");
    return { ok: true, message: "Contraseña actualizada correctamente." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function updateAlertDaysAction(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  try {
    await requireAdmin();

    const days = parseInt((formData.get("alert_days") as string) ?? "15", 10);
    if (isNaN(days) || days < 1 || days > 90)
      return { ok: false, message: "Ingresa un número entre 1 y 90." };

    const admin = createServiceSupabaseClient();
    if (!admin) return { ok: false, message: "Supabase no configurado." };

    const { error } = await admin
      .from("bookido_admin_config")
      .update({ alert_days: days })
      .eq("id", 1);

    if (error) return { ok: false, message: error.message };

    revalidatePath("/admin/configuracion");
    revalidatePath("/admin");
    return { ok: true, message: "Configuración guardada." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
