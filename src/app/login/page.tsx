import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login/LoginForm";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Entrar | Bookido Panel",
};

async function resolveLoginEmail(): Promise<{ email: string; isSuperAdmin: boolean }> {
  try {
    const slug = await getTenantSlug();
    const admin = createServiceSupabaseClient();
    if (admin) {
      const { data } = await admin
        .from("tenants")
        .select("owner_email")
        .eq("slug", slug)
        .maybeSingle();
      if (data?.owner_email) {
        return { email: data.owner_email, isSuperAdmin: false };
      }
    }
  } catch { /* not in request context or DB error */ }

  // No tenant found → admin domain
  return {
    email: process.env.ADMIN_EMAIL ?? "admin@bookido.online",
    isSuperAdmin: true,
  };
}

export default async function LoginPage() {
  const { email, isSuperAdmin } = await resolveLoginEmail();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-4">
      {/* Glows */}
      <div className="pointer-events-none fixed -left-40 top-20 h-96 w-96 rounded-full bg-[#14F195]/5 blur-[120px]" />
      <div className="pointer-events-none fixed -right-32 bottom-10 h-80 w-80 rounded-full bg-red-600/10 blur-[100px]" />
      {isSuperAdmin && (
        <div className="pointer-events-none fixed left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/5 blur-[80px]" />
      )}

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block">
            <span className="font-future text-2xl font-semibold tracking-tight text-white">
              Bookido
            </span>
          </Link>
          <p className="mt-2 text-sm text-zinc-500">Panel de administración</p>
        </div>

        {/* Card */}
        <div className={`rounded-2xl border bg-ink-900/60 p-8 backdrop-blur-sm ${
          isSuperAdmin
            ? "border-amber-400/[0.12] shadow-[0_0_40px_rgba(251,191,36,0.05)]"
            : "border-white/[0.08]"
        }`}>
          <h1 className="mb-7 font-future text-xl font-semibold text-white">
            Bienvenida de nuevo
          </h1>
          <Suspense>
            <LoginForm email={email} isSuperAdmin={isSuperAdmin} />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          ¿Olvidaste tu PIN?{" "}
          <Link href="/forgot-password" className="text-zinc-400 underline underline-offset-2 transition hover:text-zinc-200">
            Recupéralo aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
