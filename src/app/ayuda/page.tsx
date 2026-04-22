import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { guides, defaultSlug } from "@/lib/help/guides";
import { HelpCenter } from "@/components/help/HelpCenter";

export const metadata: Metadata = {
  title: "Centro de Ayuda | Bookido",
  description:
    "Guías paso a paso para configurar y sacar el máximo provecho de Bookido: servicios, reservas, WhatsApp, cancelaciones y más.",
};

type Props = {
  searchParams: Promise<{ g?: string }>;
};

export default async function AyudaPage({ searchParams }: Props) {
  const { g } = await searchParams;
  const initialSlug =
    guides.find((guide) => guide.slug === g)?.slug ?? defaultSlug;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-ink-950">
      {/* Top line glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px bg-gradient-to-r from-transparent via-[#14F195]/30 to-transparent"
        aria-hidden
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="relative z-40 flex-shrink-0 border-b border-white/[0.07] bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-5 py-4">
          {/* Left: logo + breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/panel"
              className="flex flex-col leading-none transition hover:opacity-80"
            >
              <span className="font-future text-base font-semibold tracking-tight text-white">
                Bookido
              </span>
            </Link>
            <span className="text-zinc-700" aria-hidden>
              /
            </span>
            <span className="text-sm text-zinc-400">Centro de ayuda</span>
          </div>

          {/* Right: nav links */}
          <nav className="flex items-center gap-5 text-sm text-zinc-400">
            <Link
              href="/reserva"
              className="hidden transition hover:text-white sm:block"
            >
              Reservas
            </Link>
            <Link
              href="/ayuda"
              className="font-medium text-[#14F195]/90 transition hover:text-[#14F195]"
            >
              Guías
            </Link>
            <Link
              href="/panel"
              className="hidden transition hover:text-white md:block"
            >
              ← Panel
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Main two-pane layout ─────────────────────────────────────────── */}
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <Suspense fallback={<HelpCenterSkeleton />}>
          <HelpCenter guides={guides} initialSlug={initialSlug} />
        </Suspense>
      </main>
    </div>
  );
}

function HelpCenterSkeleton() {
  return (
    <div className="flex flex-1 animate-pulse overflow-hidden">
      <div className="hidden w-72 border-r border-white/[0.07] bg-ink-900/60 lg:block" />
      <div className="flex-1 p-12 space-y-4">
        <div className="h-8 w-64 rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-96 rounded-lg bg-white/[0.04]" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 rounded-lg bg-white/[0.04]" style={{ width: `${75 - i * 5}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
