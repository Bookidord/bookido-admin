import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { getScheduleConfig } from "@/lib/booking/config";
import { NuevaCitaForm } from "@/components/panel/NuevaCitaForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NuevaCitaPage() {
  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();
  const schedule = getScheduleConfig();

  let services: { id: string; name: string; duration_minutes: number }[] = [];
  if (admin) {
    const { data } = await admin
      .from("bookido_services")
      .select("id, name, duration_minutes")
      .eq("tenant_slug", tenant)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    services = data ?? [];
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-8 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="mb-7">
        <Link
          href="/panel/reservas"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a reservas
        </Link>
        <h1 className="font-future text-2xl font-semibold text-white">
          Nueva cita manual
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Crea una cita directamente desde el panel. Se guardará como confirmada.
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5 sm:p-6">
        <NuevaCitaForm
          services={services}
          openHour={schedule.openHour}
          closeHour={schedule.closeHour}
          slotMinutes={schedule.slotMinutes}
        />
      </div>
    </div>
  );
}
