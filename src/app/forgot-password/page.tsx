import { Suspense } from "react";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/login/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-4">
      <div className="pointer-events-none fixed -left-40 top-20 h-96 w-96 rounded-full bg-rose-600/10 blur-[120px]" />
      <div className="pointer-events-none fixed -right-32 bottom-10 h-80 w-80 rounded-full bg-red-600/10 blur-[100px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/login" className="inline-block">
            <span className="font-future text-2xl font-semibold tracking-tight text-white">
              Bookido
            </span>
          </Link>
          <p className="mt-2 text-sm text-zinc-500">Panel de administración</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-ink-900/60 p-8 backdrop-blur-sm">
          <h1 className="mb-2 font-future text-xl font-semibold text-white">
            Recuperar acceso
          </h1>
          <p className="mb-6 text-sm text-zinc-500">
            Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </p>
          <Suspense>
            <ForgotPasswordForm />
          </Suspense>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-xs text-zinc-600 transition hover:text-zinc-400"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
