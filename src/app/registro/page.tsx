import type { Metadata } from "next";
import Link from "next/link";
import { RegistroForm } from "@/components/registro/RegistroForm";

export const metadata: Metadata = {
  title: "Crea tu panel gratis | Bookido",
  description:
    "Crea tu sistema de reservas online en 2 minutos. Gratis. Sin tarjeta de crédito.",
};

export default function RegistroPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-4 py-12">
      {/* Background glows */}
      <div className="pointer-events-none fixed -left-40 top-20 h-96 w-96 rounded-full bg-[#14F195]/5 blur-[120px]" />
      <div className="pointer-events-none fixed -right-32 bottom-10 h-80 w-80 rounded-full bg-purple-600/8 blur-[100px]" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block">
            <span className="font-future text-2xl font-semibold tracking-tight text-white">
              Bookido
            </span>
          </Link>
          <p className="mt-2 text-sm text-zinc-500">
            Reservas online para tu negocio
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-ink-900/60 p-8 backdrop-blur-sm">
          <h1 className="mb-2 font-future text-xl font-semibold text-white">
            Crea tu panel gratis
          </h1>
          <p className="mb-7 text-sm text-zinc-500">
            En 2 minutos tienes tu página de reservas lista para compartir.
          </p>

          <RegistroForm />
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-xs text-zinc-600">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-zinc-400 underline underline-offset-2 transition hover:text-zinc-200"
          >
            Inicia sesión
          </Link>
        </p>

        {/* Feature bullets */}
        <ul className="mt-8 space-y-2">
          {[
            "Página de reservas con tu subdominio exclusivo",
            "Panel de administración para gestionar citas",
            "Botón de WhatsApp incluido",
            "Sin comisiones, sin contratos",
          ].map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-zinc-600">
              <span className="mt-px text-[#14F195]/60">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
