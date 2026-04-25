"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { createServiceSupabaseClient as createAdminClient } from "@/lib/supabase/admin";
import { createSessionToken, ADMIN_COOKIE } from "@/lib/admin-session";

/** Genera hash scrypt con salt: "salt:hash" */
export function hashPasswordSecure(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Verifica contra hash scrypt ("salt:hash") o SHA256 legacy (64 hex chars sin ":") */
function verifyPassword(pw: string, stored: string): boolean {
  if (stored.includes(":")) {
    // scrypt format: salt:hash
    const [salt, hashHex] = stored.split(":");
    try {
      const derived = scryptSync(pw, salt, 64);
      return timingSafeEqual(derived, Buffer.from(hashHex, "hex"));
    } catch {
      return false;
    }
  } else {
    // Legacy SHA256+secret
    const secret = process.env.ADMIN_SESSION_SECRET ?? "dev";
    const legacy = createHash("sha256").update(pw + secret).digest("hex");
    return timingSafeEqual(Buffer.from(legacy), Buffer.from(stored));
  }
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
        passwordValid = verifyPassword(password, config.password_hash);
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
