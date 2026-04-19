"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "crypto";
import { createServiceSupabaseClient as createAdminClient } from "@/lib/supabase/admin";
import { createSessionToken, ADMIN_COOKIE } from "@/lib/admin-session";

function hashPassword(pw: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "dev";
  return createHash("sha256").update(pw + secret).digest("hex");
}

export async function adminLoginAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || email !== adminEmail) {
    return { error: "Credenciales incorrectas." };
  }

  // Check DB config first (custom password), fall back to env var
  let passwordValid = false;
  try {
    const admin = createAdminClient();
    if (admin) {
      const { data: config } = await admin
        .from("bookido_admin_config")
        .select("password_hash")
        .eq("id", 1)
        .single();

      if (config?.password_hash) {
        passwordValid = hashPassword(password) === config.password_hash;
      } else {
        // No custom password set — compare against env var
        passwordValid = password === process.env.ADMIN_PASSWORD;
      }
    } else {
      passwordValid = password === process.env.ADMIN_PASSWORD;
    }
  } catch {
    passwordValid = password === process.env.ADMIN_PASSWORD;
  }

  if (!passwordValid) {
    return { error: "Credenciales incorrectas." };
  }

  const token = await createSessionToken(email);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
