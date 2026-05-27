import Link from "next/link";
import { Suspense } from "react";
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
  // Per-tenant schedule from DB, fallback to global config
  let schedule = getScheduleConfig();
  if (admin) {
    const { data: hours } = await admin
      .from("bookido_business_hours")
      .select("slots, is_open")
      .eq("tenant_slug", tenantSlug)
      .eq("is_open", true)
      .limit(1);
    if (hours && hours.length > 0 && hours[0].slots?.length > 0) {
      const slot = hours[0].slots[0];
      const openH = parseInt(slot.open?.split(":")[0] || "10", 10);
      const closeH = parseInt(slot.close?.split(":")[0] || "20", 10);
      schedule = { openHour: openH, closeHour: closeH, slotMinutes: schedule.slotMinutes };
    }
  }
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
      <div className="flex h-dvh flex-col bg-ink-950 bg-grid-fade">
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

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden">
            <Suspense>
              <BookingReservaClient
                services={services}
                configured={configured}
                tenantSlug={tenantSlug}
                schedule={schedule}
              />
            </Suspense>
          </div>
        </main>
      </div>
    </>
  );
}
