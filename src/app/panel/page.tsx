import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getTenantSlug } from "@/lib/tenant";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { CopyLinkButton } from "@/components/panel/CopyLinkButton";
import { DashboardExtras } from "@/components/panel/DashboardExtras";
import {
  getGreeting,
  computeStreak,
  computeWeeklyRecord,
  getPhraseOfDay,
  getTipOfDay,
  computeBadges,
} from "@/lib/dashboard-utils";

export const dynamic = "force-dynamic";

// ─── helpers ──────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  if (status === "confirmed")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Confirmada
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
      Cancelada
    </span>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────────
export default async function PanelPage() {
  const admin = createServiceSupabaseClient();
  const tenant = await getTenantSlug();
  const now = new Date();

  type Booking = {
    id: string;
    starts_at: string;
    ends_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    notes: string | null;
    status: string;
    service_name: string;
    service_price?: number | null;
  };

  let todayBookings: Booking[] = [];
  let upcomingBookings: Booking[] = [];
  let statsWeek = 0;
  let statsLastWeek = 0;
  let statsToday = 0;
  let statsPending = 0;
  let statsNewClientsMonth = 0;
  let estimatedRevenueToday = 0;
  let nextBooking: { starts_at: string; customer_name: string; service_name: string; is_today: boolean } | null = null;
  let peakHour: number | null = null;
  let peakHourCount = 0;
  let topClients: { name: string; count: number }[] = [];

  // New module data
  let allDateRows: { starts_at: string }[] = [];
  let totalBookingCount = 0;
  let landingTemplate = "default";

  // Week per-day breakdown: index 0=Mon … 6=Sun
  const weekDayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

  if (admin) {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Services with price
    const { data: services } = await admin
      .from("bookido_services")
      .select("id, name, price")
      .eq("tenant_slug", tenant);

    const svcMap: Record<string, { name: string; price: number | null }> = {};
    services?.forEach((s) => { svcMap[s.id] = { name: s.name, price: s.price ?? null }; });

    // Today's bookings
    const { data: todayRaw } = await admin
      .from("bookido_bookings")
      .select("id, starts_at, ends_at, customer_name, customer_email, customer_phone, notes, status, service_id")
      .eq("tenant_slug", tenant)
      .gte("starts_at", startOfDay(now).toISOString())
      .lte("starts_at", endOfDay(now).toISOString())
      .order("starts_at", { ascending: true });

    todayBookings = (todayRaw ?? []).map((b) => ({
      ...b,
      service_name: b.service_id ? (svcMap[b.service_id]?.name ?? "—") : "—",
      service_price: b.service_id ? (svcMap[b.service_id]?.price ?? null) : null,
    }));

    statsToday = todayBookings.filter((b) => b.status === "confirmed").length;

    // Estimated revenue today = sum of confirmed bookings' prices
    estimatedRevenueToday = todayBookings
      .filter((b) => b.status === "confirmed" && b.service_price)
      .reduce((sum, b) => sum + (b.service_price ?? 0), 0);

    // Week stats + per-day breakdown
    const { data: weekBookings } = await admin
      .from("bookido_bookings")
      .select("starts_at, status")
      .eq("tenant_slug", tenant)
      .eq("status", "confirmed")
      .gte("starts_at", weekStart.toISOString())
      .lte("starts_at", weekEnd.toISOString());

    statsWeek = weekBookings?.length ?? 0;

    weekBookings?.forEach((b) => {
      const d = getDay(new Date(b.starts_at)); // 0=Sun,1=Mon…6=Sat
      // Convert to Mon=0 … Sun=6
      const idx = d === 0 ? 6 : d - 1;
      weekDayCounts[idx]++;
    });

    // Last week count (for delta)
    const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: lastWeekData } = await admin
      .from("bookido_bookings")
      .select("id")
      .eq("tenant_slug", tenant)
      .eq("status", "confirmed")
      .gte("starts_at", lastWeekStart.toISOString())
      .lte("starts_at", lastWeekEnd.toISOString());
    statsLastWeek = lastWeekData?.length ?? 0;

    // Peak hour (last 30 days confirmed bookings)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const { data: recentBookings } = await admin
      .from("bookido_bookings")
      .select("starts_at")
      .eq("tenant_slug", tenant)
      .eq("status", "confirmed")
      .gte("starts_at", thirtyDaysAgo.toISOString());
    const hourCounts: Record<number, number> = {};
    recentBookings?.forEach((b) => {
      const h = new Date(b.starts_at).getHours();
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    });
    Object.entries(hourCounts).forEach(([h, count]) => {
      if (count > peakHourCount) { peakHourCount = count; peakHour = parseInt(h); }
    });

    // Pending (pending status)
    const { count: pCount } = await admin
      .from("bookido_bookings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_slug", tenant)
      .eq("status", "pending");
    statsPending = pCount ?? 0;

    // New clients this month + top clients
    const { data: monthBookings } = await admin
      .from("bookido_bookings")
      .select("customer_email, customer_name")
      .eq("tenant_slug", tenant)
      .gte("starts_at", startOfMonth(now).toISOString());
    const uniqueEmails = new Set(monthBookings?.map((b) => b.customer_email) ?? []);
    statsNewClientsMonth = uniqueEmails.size;
    const clientMap: Record<string, { name: string; count: number }> = {};
    monthBookings?.forEach((b) => {
      const key = b.customer_email;
      if (!clientMap[key]) clientMap[key] = { name: b.customer_name, count: 0 };
      clientMap[key].count++;
    });
    topClients = Object.values(clientMap).sort((a, b) => b.count - a.count).slice(0, 3);

    // Next upcoming booking (confirmed OR pending, from start of today onwards)
    const { data: upcoming } = await admin
      .from("bookido_bookings")
      .select("starts_at, customer_name, service_id")
      .eq("tenant_slug", tenant)
      .in("status", ["confirmed", "pending"])
      .gte("starts_at", startOfDay(now).toISOString())
      .order("starts_at", { ascending: true })
      .limit(1);
    if (upcoming?.[0]) {
      const nbDate = new Date(upcoming[0].starts_at);
      nextBooking = {
        starts_at: upcoming[0].starts_at,
        customer_name: upcoming[0].customer_name,
        service_name: upcoming[0].service_id ? (svcMap[upcoming[0].service_id]?.name ?? "—") : "—",
        is_today: nbDate >= startOfDay(now) && nbDate <= endOfDay(now),
      };
    }

    // Next 3 upcoming beyond today (for empty-state fallback; confirmed OR pending)
    const { data: upcoming3Raw } = await admin
      .from("bookido_bookings")
      .select("id, starts_at, ends_at, customer_name, customer_email, customer_phone, notes, status, service_id")
      .eq("tenant_slug", tenant)
      .in("status", ["confirmed", "pending"])
      .gt("starts_at", endOfDay(now).toISOString())
      .order("starts_at", { ascending: true })
      .limit(3);

    upcomingBookings = (upcoming3Raw ?? []).map((b) => ({
      ...b,
      service_name: b.service_id ? (svcMap[b.service_id]?.name ?? "—") : "—",
    }));

    // ── Extra dashboard modules ────────────────────────────────────────────
    const since365 = new Date(Date.now() - 365 * 86_400_000).toISOString();
    const [datesRes, countRes, landingRes] = await Promise.all([
      admin.from("bookido_bookings")
        .select("starts_at")
        .eq("tenant_slug", tenant)
        .eq("status", "confirmed")
        .gte("starts_at", since365),
      admin.from("bookido_bookings")
        .select("id", { count: "exact", head: true })
        .eq("tenant_slug", tenant)
        .eq("status", "confirmed"),
      admin.from("bookido_landings")
        .select("template")
        .eq("tenant_slug", tenant)
        .maybeSingle(),
    ]);
    allDateRows = datesRes.data ?? [];
    totalBookingCount = countRes.count ?? 0;
    landingTemplate = landingRes.data?.template ?? "default";
  }

  const dateLabel = format(now, "EEEE d 'de' MMMM", { locale: es });
  const maxWeekDay = Math.max(...weekDayCounts, 1);
  const weekDayLabels = ["L", "M", "X", "J", "V", "S", "D"];

  // Dashboard extras computed server-side
  const allStarts = allDateRows.map((d) => d.starts_at);
  const racha = computeStreak(allStarts);
  const mejorSemana = computeWeeklyRecord(allStarts);
  const { unlocked: unlockedBadges, nextBadge } = computeBadges(totalBookingCount, racha);
  const phraseOfDay = getPhraseOfDay(landingTemplate, tenant, now);
  const tipOfDay = getTipOfDay(now);
  const greeting = getGreeting(now);

  // Turno destacado: highest-price confirmed booking today
  const turnoDestacado = (() => {
    const confirmed = todayBookings
      .filter((b) => b.status === "confirmed" && b.service_price != null)
      .sort((a, b) => (b.service_price ?? 0) - (a.service_price ?? 0));
    if (!confirmed[0]) return null;
    return {
      customerName: confirmed[0].customer_name,
      serviceName: confirmed[0].service_name,
      price: confirmed[0].service_price!,
    };
  })();

  const stats = [
    {
      label: "Reservas hoy",
      value: statsToday,
      sub: null,
      accent: "rose",
    },
    {
      label: "Esta semana",
      value: statsWeek,
      sub: statsLastWeek > 0
        ? statsWeek > statsLastWeek
          ? `↑${statsWeek - statsLastWeek} vs sem. pasada`
          : statsWeek < statsLastWeek
          ? `↓${statsLastWeek - statsWeek} vs sem. pasada`
          : "igual que sem. pasada"
        : null,
      accent: "purple",
    },
    {
      label: "Ingresos hoy",
      value: estimatedRevenueToday > 0 ? `$${estimatedRevenueToday}` : "—",
      sub: "estimado",
      accent: "emerald",
    },
    {
      label: "Por confirmar",
      value: statsPending,
      sub: statsPending === 1 ? "pendiente" : "pendientes",
      accent: statsPending > 0 ? "amber" : "zinc",
    },
    {
      label: "Clientes nuevos",
      value: statsNewClientsMonth,
      sub: "este mes",
      accent: "teal",
    },
  ];

  const accentMap: Record<string, string> = {
    rose: "text-[#14F195]",
    purple: "text-purple-300",
    emerald: "text-emerald-300",
    blue: "text-blue-300",
    amber: "text-amber-300",
    teal: "text-teal-300",
    zinc: "text-zinc-400",
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-500">{dateLabel}</p>
          <h1 className="mt-1 font-future text-2xl font-semibold text-white md:text-3xl">
            {greeting.emoji} {greeting.text}
          </h1>
          {phraseOfDay && (
            <p className="mt-1 text-sm text-zinc-500 italic">{phraseOfDay}</p>
          )}
        </div>
        <CopyLinkButton bookingUrl={
          process.env.NODE_ENV === "production"
            ? `https://${tenant}.bookido.online/reserva`
            : "/reserva"
        } />
      </div>

      {/* Stats row — 6 cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4"
          >
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className={`mt-1.5 font-future text-2xl font-semibold ${accentMap[s.accent]}`}>
              {s.value}
            </p>
            {s.sub && (
              <p className="mt-0.5 truncate text-xs text-zinc-600">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Today's schedule */}
      <div className="rounded-xl border border-white/[0.07] bg-ink-900/40">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <h2 className="font-future text-base font-semibold text-white">
            Agenda de hoy
          </h2>
          <Link
            href="/panel/reservas"
            className="text-xs text-zinc-500 transition hover:text-zinc-300"
          >
            Ver todas →
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          upcomingBookings.length > 0 ? (
            <div>
              <div className="px-5 pt-5 pb-2">
                <p className="text-xs text-zinc-500">No hay reservas para hoy. Próximas:</p>
              </div>
              <ul className="divide-y divide-white/[0.05]">
                {upcomingBookings.map((b) => {
                  const start = new Date(b.starts_at);
                  return (
                    <li key={b.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-0">
                      {/* Date + time block */}
                      <div className="flex-shrink-0 sm:w-32">
                        <p className="font-mono text-sm font-semibold text-white">
                          {format(start, "HH:mm")}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {format(start, "EEE d MMM", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
                        </p>
                      </div>
                      {/* Client info */}
                      <div className="flex-1 sm:pl-4">
                        <p className="text-sm font-medium text-zinc-100">{b.customer_name}</p>
                        <p className="text-xs text-zinc-500">{b.service_name}</p>
                      </div>
                      <div className="flex-shrink-0">{statusBadge(b.status)}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-2xl">📭</p>
              <p className="mt-3 text-sm text-zinc-500">No hay reservas para hoy.</p>
              <p className="mt-1 text-xs text-zinc-600">
                Las nuevas reservas aparecerán aquí automáticamente.
              </p>
            </div>
          )
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {todayBookings.map((b) => {
              const start = new Date(b.starts_at);
              const end = new Date(b.ends_at);
              const isPast = end < now;
              return (
                <li
                  key={b.id}
                  className={`flex flex-col gap-3 px-5 py-4 transition sm:flex-row sm:items-center sm:gap-0 ${isPast ? "opacity-50" : ""}`}
                >
                  {/* Time block */}
                  <div className="flex-shrink-0 sm:w-24">
                    <p className="font-mono text-sm font-semibold text-white">
                      {format(start, "HH:mm")}
                    </p>
                    <p className="text-xs text-zinc-600">{format(end, "HH:mm")}</p>
                  </div>

                  {/* Client info */}
                  <div className="flex-1 sm:pl-4">
                    <p className="text-sm font-medium text-zinc-100">{b.customer_name}</p>
                    <p className="text-xs text-zinc-500">{b.service_name}</p>
                    {b.notes && (
                      <p className="mt-1 text-xs italic text-zinc-600">
                        &ldquo;{b.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Contact + status */}
                  <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                    {b.customer_phone && (
                      <a
                        href={`https://wa.me/${b.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${b.customer_name}, te recordamos tu turno a las ${format(start, "HH:mm")}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/15"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </a>
                    )}
                    {statusBadge(b.status)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Peak hour + Top clients */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Hora pico */}
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
          <h2 className="font-future text-base font-semibold text-white">Hora pico</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Últimos 30 días</p>
          {peakHour !== null ? (
            <div className="mt-4 flex items-end gap-3">
              <span className="font-future text-4xl font-semibold text-amber-300">
                {String(peakHour).padStart(2, "0")}:00
              </span>
              <span className="mb-1 text-xs text-zinc-500">{peakHourCount} reservas</span>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-600">Sin datos aún</p>
          )}
        </div>

        {/* Clientes frecuentes */}
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
          <h2 className="font-future text-base font-semibold text-white">Clientes frecuentes</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Este mes</p>
          {topClients.length > 0 ? (
            <ul className="mt-4 space-y-2.5">
              {topClients.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-semibold ${i === 0 ? "text-amber-300" : "text-zinc-600"}`}>
                      #{i + 1}
                    </span>
                    <span className="text-sm text-zinc-200">{c.name}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{c.count} {c.count === 1 ? "reserva" : "reservas"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-600">Sin reservas este mes</p>
          )}
        </div>
      </div>

      {/* ── Dashboard extras (módulos 7-13) ─────────────────────────────── */}
      <DashboardExtras
        nextBookingISO={nextBooking?.starts_at ?? null}
        nextBookingName={nextBooking?.customer_name ?? ""}
        nextServiceName={nextBooking?.service_name ?? ""}
        racha={racha}
        mejorSemana={mejorSemana}
        totalBookings={totalBookingCount}
        turnoDestacado={turnoDestacado}
        phraseOfDay={phraseOfDay}
        tipOfDay={tipOfDay}
        unlockedBadges={unlockedBadges}
        nextBadge={nextBadge}
      />
    </div>
  );
}
