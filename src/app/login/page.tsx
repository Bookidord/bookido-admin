import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login/LoginForm";

export const metadata: Metadata = {
  title: "Entrar | Bookido Panel",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-4">
      {/* Glows */}
      <div className="pointer-events-none fixed -left-40 top-20 h-96 w-96 rounded-full bg-[#14F195]/5 blur-[120px]" />
      <div className="pointer-events-none fixed -right-32 bottom-10 h-80 w-80 rounded-full bg-red-600/10 blur-[100px]" />

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
        <div className="rounded-2xl border border-white/[0.08] bg-ink-900/60 p-8 backdrop-blur-sm">
          <h1 className="mb-6 font-future text-xl font-semibold text-white">
            Bienvenida de nuevo
          </h1>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          ¿Olvidaste tu contraseña?{" "}
          <Link href="/forgot-password" className="text-zinc-400 underline underline-offset-2 transition hover:text-zinc-200">
            Recupérala aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
