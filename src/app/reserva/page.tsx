import Link from "next/link";
import { BookingReservaClient } from "@/components/booking/BookingReservaClient";
import { getTenantSlug } from "@/lib/tenant";
import { getScheduleConfig } from "@/lib/booking/config";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/settings";
import { buildThemeStyle } from "@/lib/theme";
import type { ServiceRow } from "@/lib/booking/types";

export const dynamic = "force-dynamic";

export default async function ReservaPage() {
  const admin = createServiceSupabaseClient();
  const configured = admin !== null;
  const tenantSlug = await getTenantSlug();
  const schedule = getScheduleConfig();
  const settings = await getSettings();

  let services: ServiceRow[] = [];
  if (admin) {
    const { data } = await admin
      .from("bookido_services")
      .select("id, name, duration_minutes")
      .eq("tenant_slug", tenantSlug)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    services = (data as ServiceRow[] | null) ?? [];
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: buildThemeStyle({ primary: settings.primary_color }),
        }}
      />
      <div className="min-h-dvh bg-ink-950 bg-grid-fade">
        {/* Top accent line — uses tenant primary */}
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgb(var(--primary) / 0.4), transparent)",
          }}
          aria-hidden
        />

        <header className="relative z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
            <Link href="/" className="flex flex-col transition hover:opacity-90">
              <span className="font-display text-xl font-semibold tracking-wide text-white md:text-2xl">
                {settings.business_name}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                Reservas
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-zinc-400">
              <Link href="/ayuda" className="transition hover:text-zinc-200">
                Guías
              </Link>
              <Link href="/" className="transition hover:text-white">
                ← Inicio
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-14 lg:px-8 lg:py-20">
          <BookingReservaClient
            services={services}
            configured={configured}
            tenantSlug={tenantSlug}
            schedule={schedule}
          />
        </main>

        <footer className="border-t border-white/[0.06] px-6 py-8 lg:px-8">
          <p className="mx-auto max-w-6xl text-center text-xs text-zinc-600">
            Reservas con <span className="text-zinc-500">BookiDo</span>
          </p>
        </footer>
      </div>
    </>
  );
}
