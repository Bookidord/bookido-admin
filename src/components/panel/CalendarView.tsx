"use client";

import { useState } from "react";
import { format, getDaysInMonth, getDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

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
};

const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-emerald-400",
  completed: "bg-blue-400",
  cancelled: "bg-zinc-500",
  no_show: "bg-amber-400",
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmada",     cls: "bg-emerald-400/10 text-emerald-400 ring-emerald-400/20" },
  completed: { label: "Completada",     cls: "bg-blue-400/10 text-blue-400 ring-blue-400/20" },
  cancelled: { label: "Cancelada",      cls: "bg-zinc-600/10 text-zinc-500 ring-zinc-600/20" },
  no_show:   { label: "No se presentó", cls: "bg-amber-400/10 text-amber-400 ring-amber-400/20" },
};

function parseDate(iso: string) {
  return new Date(iso.replace(" ", "T"));
}

export function CalendarView({
  bookings,
  year,
  month,
}: {
  bookings: Booking[];
  year: number;
  month: number;
}) {
  const router = useRouter();
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    // Default: select today if in current month, else day 1
    if (today.getFullYear() === year && today.getMonth() + 1 === month) {
      return today.getDate();
    }
    return 1;
  });

  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
  // weekday of 1st (0=Sun, convert to Mon-first: Mon=0..Sun=6)
  const firstWeekday = getDay(new Date(year, month - 1, 1));
  const startOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;

  // Group bookings by day
  const byDay: Record<number, Booking[]> = {};
  bookings.forEach((b) => {
    const d = parseDate(b.starts_at);
    const day = d.getDate();
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(b);
  });

  const dayBookings = selectedDay ? (byDay[selectedDay] ?? []) : [];

  function navigate(delta: 1 | -1) {
    const current = new Date(year, month - 1, 1);
    const next = delta === 1 ? addMonths(current, 1) : subMonths(current, 1);
    router.push(`/panel/calendario?year=${next.getFullYear()}&month=${next.getMonth() + 1}`);
  }

  const monthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: es });

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Calendar grid */}
      <div className="flex-1">
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="font-future text-base font-semibold capitalize text-white">{monthLabel}</h2>
            <button
              onClick={() => navigate(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty offset cells */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayBks = byDay[day] ?? [];
              const isToday =
                today.getDate() === day &&
                today.getMonth() + 1 === month &&
                today.getFullYear() === year;
              const isSelected = selectedDay === day;
              const confirmed = dayBks.filter((b) => b.status === "confirmed").length;
              const total = dayBks.length;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex min-h-[52px] flex-col items-center rounded-xl p-1.5 transition ${
                    isSelected
                      ? "bg-[#14F195]/10 ring-1 ring-[#14F195]/30"
                      : isToday
                      ? "bg-white/[0.06] ring-1 ring-white/10"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`text-xs font-medium leading-none ${
                      isSelected
                        ? "text-[#14F195]"
                        : isToday
                        ? "text-white"
                        : "text-zinc-400"
                    }`}
                  >
                    {day}
                  </span>
                  {total > 0 && (
                    <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                      {/* Show up to 3 dots */}
                      {dayBks.slice(0, 3).map((b) => (
                        <span
                          key={b.id}
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[b.status] ?? "bg-zinc-500"}`}
                        />
                      ))}
                      {total > 3 && (
                        <span className="text-[9px] leading-none text-zinc-600">+{total - 3}</span>
                      )}
                    </div>
                  )}
                  {confirmed > 0 && (
                    <span className="mt-auto text-[9px] font-semibold leading-none text-[#14F195]/70">
                      {confirmed}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-3">
            {Object.entries(STATUS_DOT).map(([status, cls]) => (
              <span key={status} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <span className={`h-2 w-2 rounded-full ${cls}`} />
                {STATUS_BADGE[status]?.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Day detail panel */}
      <div className="lg:w-80">
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/40">
          {/* Header */}
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="text-sm font-semibold text-white">
              {selectedDay
                ? format(new Date(year, month - 1, selectedDay), "EEEE d 'de' MMMM", { locale: es })
                    .replace(/^\w/, (c) => c.toUpperCase())
                : "Selecciona un día"}
            </p>
            <p className="text-xs text-zinc-500">
              {dayBookings.length} reserva{dayBookings.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Booking list */}
          <div className="divide-y divide-white/[0.04]">
            {dayBookings.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-lg text-zinc-600">—</p>
                <p className="mt-1 text-xs text-zinc-600">Sin reservas este día</p>
              </div>
            ) : (
              dayBookings.map((b) => {
                const start = parseDate(b.starts_at);
                const end = parseDate(b.ends_at);
                const badge = STATUS_BADGE[b.status] ?? STATUS_BADGE.confirmed;
                const mins = Math.round((end.getTime() - start.getTime()) / 60000);
                return (
                  <div key={b.id} className={`px-4 py-3 ${b.status !== "confirmed" ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm font-semibold text-white shrink-0">
                          {format(start, "HH:mm")}
                        </span>
                        <span className="text-xs text-zinc-600 shrink-0">{mins}min</span>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-zinc-200 truncate">{b.customer_name}</p>
                    <p className="text-xs text-zinc-500 truncate">{b.service_name}</p>
                    {b.customer_phone && (
                      <a
                        href={`https://wa.me/${b.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${b.customer_name}, te recordamos tu turno a las ${format(start, "HH:mm")}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-400 transition hover:text-emerald-300"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        {b.customer_phone}
                      </a>
                    )}
                    {b.notes && (
                      <p className="mt-1 text-[11px] italic text-zinc-600 truncate">&ldquo;{b.notes}&rdquo;</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
