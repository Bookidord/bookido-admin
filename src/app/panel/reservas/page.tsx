import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import { BookingRow } from "@/components/panel/BookingRow";
import { BookingCard } from "@/components/panel/BookingCard";
import Link from "next/link";
import { startOfWeek, endOfWeek, getDay } from "date-fns";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; days?: string }>;

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status = "all", days = "30" } = await searchParams;
  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();

  const now = new Date();
  const weekDayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
  let statsWeek = 0;

  let bookings: {
    id: string;
    starts_at: string;
    ends_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    notes: string | null;
    status: string;
    service_id: string | null;
    service_name: string;
  }[] = [];

  let total = 0;

  if (admin) {
    // Week bar chart data
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const { data: weekBookings } = await admin
      .from("bookido_bookings")
      .select("starts_at")
      .eq("tenant_slug", tenant)
      .eq("status", "confirmed")
      .gte("starts_at", weekStart.toISOString())
      .lte("starts_at", weekEnd.toISOString());
    statsWeek = weekBookings?.length ?? 0;
    weekBookings?.forEach((b) => {
      const d = getDay(new Date(b.starts_at));
      const idx = d === 0 ? 6 : d - 1;
      weekDayCounts[idx]++;
    });

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days, 10));

    let query = admin
      .from("bookido_bookings")
      .select("id, starts_at, ends_at, customer_name, customer_email, customer_phone, notes, status, service_id", { count: "exact" })
      .eq("tenant_slug", tenant)
      .gte("starts_at", since.toISOString())
      .order("starts_at", { ascending: false });

    if (status !== "all") query = query.eq("status", status);

    const { data, count } = await query;
    total = count ?? 0;

    const { data: services } = await admin
      .from("bookido_services")
      .select("id, name")
      .eq("tenant_slug", tenant);

    const svcMap: Record<string, string> = {};
    services?.forEach((s) => { svcMap[s.id] = s.name; });

    bookings = (data ?? []).map((b) => ({
      ...b,
      service_name: b.service_id ? (svcMap[b.service_id] ?? "—") : "—",
    }));
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-future text-2xl font-semibold text-white">Reservas</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {total} resultado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/panel/reservas/nueva"
          className="flex items-center gap-2 self-start rounded-full bg-[#14F195] px-4 py-2 text-sm font-semibold text-[#0A0A0F] transition hover:opacity-90 sm:self-auto"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva reserva
        </Link>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Todas",       value: "all" },
            { label: "Confirmadas", value: "confirmed" },
            { label: "Completadas", value: "completed" },
            { label: "No-show",     value: "no_show" },
            { label: "Canceladas",  value: "cancelled" },
          ].map((f) => (
            <a
              key={f.value}
              href={`/panel/reservas?status=${f.value}&days=${days}`}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                status === f.value
                  ? "bg-[#14F195]/10 text-[#14F195] ring-1 ring-[#14F195]/25"
                  : "border border-white/[0.07] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {f.label}
            </a>
          ))}

          <span className="mx-1 text-zinc-700">|</span>

          {[
            { label: "7 días", value: "7" },
            { label: "30 días", value: "30" },
            { label: "90 días", value: "90" },
          ].map((d) => (
            <a
              key={d.value}
              href={`/panel/reservas?status=${status}&days=${d.value}`}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                days === d.value
                  ? "bg-ink-800 text-white ring-1 ring-white/[0.1]"
                  : "border border-white/[0.07] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {d.label}
            </a>
          ))}
        </div>
      </div>

      {/* Weekly summary chart */}
      {(() => {
        const weekDayLabels = ["L", "M", "X", "J", "V", "S", "D"];
        const maxWeekDay = Math.max(...weekDayCounts, 1);
        return (
          <div className="mb-6 rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
            <h2 className="mb-4 font-future text-base font-semibold text-white">Resumen de la semana</h2>
            <div className="flex items-end gap-2" style={{ height: 64 }}>
              {weekDayLabels.map((label, i) => {
                const count = weekDayCounts[i];
                const rawPct = Math.round((count / maxWeekDay) * 100);
                const barPct = count > 0 ? Math.max(60, rawPct) : 6;
                const isToday = i === (getDay(now) === 0 ? 6 : getDay(now) - 1);
                return (
                  <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500 leading-none" style={{ minHeight: 14 }}>
                      {count > 0 ? count : ""}
                    </span>
                    <div className="flex w-full flex-col justify-end flex-1">
                      <div
                        className={`w-full rounded-md transition-all ${isToday ? "bg-[#14F195]/60" : count > 0 ? "bg-white/20" : "bg-white/[0.05]"}`}
                        style={{ height: `${barPct}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium uppercase tracking-wide leading-none ${isToday ? "text-[#14F195]" : "text-zinc-600"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-zinc-600">
              {statsWeek} {statsWeek === 1 ? "reserva confirmada" : "reservas confirmadas"} esta semana
            </p>
          </div>
        );
      })()}

      {/* Mobile card list (< sm) */}
      <div className="sm:hidden space-y-3">
        {bookings.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 py-16 text-center">
            <p className="text-2xl">📭</p>
            <p className="mt-3 text-sm text-zinc-500">No hay reservas en este período.</p>
          </div>
        ) : (
          bookings.map((b) => <BookingCard key={b.id} b={b} />)
        )}
      </div>

      {/* Desktop table (≥ sm) */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-white/[0.07] bg-ink-900/40">
        {bookings.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl">📭</p>
            <p className="mt-3 text-sm text-zinc-500">No hay reservas en este período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Hora", "Cliente", "Servicio", "Teléfono", "Estado", ""].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-zinc-600 ${
                        h === "Teléfono" ? "hidden lg:table-cell" : ""
                      } ${h === "Servicio" ? "hidden sm:table-cell" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <BookingRow key={b.id} b={b} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
