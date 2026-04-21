"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  addDays,
  addMinutes,
  endOfDay,
  format,
  isAfter,
  isBefore,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import {
  createBookingAction,
  getBusyIntervalsAction,
} from "@/app/reserva/actions";
import type { ServiceRow } from "@/lib/booking/types";

export type ScheduleConfig = {
  openHour: number;
  closeHour: number;
  slotMinutes: number;
};

type Props = {
  services: ServiceRow[];
  configured: boolean;
  tenantSlug: string;
  schedule: ScheduleConfig;
};

function generateSlots(
  day: Date,
  durationMinutes: number,
  busy: { starts_at: string; ends_at: string }[],
  schedule: ScheduleConfig,
): Date[] {
  const dayStart = startOfDay(day);
  const closeBoundary = setMinutes(
    setHours(dayStart, schedule.closeHour),
    0,
  );
  let t = setMinutes(setHours(dayStart, schedule.openHour), 0);
  const out: Date[] = [];

  while (true) {
    const slotEnd = addMinutes(t, durationMinutes);
    if (isAfter(slotEnd, closeBoundary)) {
      break;
    }
    const overlaps = busy.some((b) => {
      const bs = new Date(b.starts_at);
      const be = new Date(b.ends_at);
      return t < be && slotEnd > bs;
    });
    if (!overlaps) {
      out.push(t);
    }
    t = addMinutes(t, schedule.slotMinutes);
  }

  return out;
}

export function BookingReservaClient({
  services,
  configured,
  tenantSlug,
  schedule,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [serviceId, setServiceId] = useState<string>(
    services[0]?.id ?? "",
  );
  const [busy, setBusy] = useState<{ starts_at: string; ends_at: string }[]>(
    [],
  );
  const [busyError, setBusyError] = useState<string | null>(null);
  const [slotLoading, setSlotLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookedDetails, setBookedDetails] = useState<{
    serviceName: string;
    startsAt: Date;
    customerName: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const service = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId],
  );

  const refreshBusy = useCallback(async () => {
    if (!selectedDate || !configured) return;
    setSlotLoading(true);
    setBusyError(null);
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    const res = await getBusyIntervalsAction(
      tenantSlug,
      start.toISOString(),
      end.toISOString(),
    );
    setSlotLoading(false);
    if (res.ok) {
      setBusy(res.intervals);
    } else {
      setBusyError(res.error);
      setBusy([]);
    }
  }, [configured, selectedDate, tenantSlug]);

  useEffect(() => {
    setSelectedSlot(null);
    void refreshBusy();
  }, [refreshBusy, serviceId]);

  const slots = useMemo(() => {
    if (!selectedDate || !service) return [];
    return generateSlots(selectedDate, service.duration_minutes, busy, schedule);
  }, [selectedDate, service, busy, schedule]);

  const todayStart = startOfDay(new Date());
  const maxDay = addDays(todayStart, 60);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!service || !selectedSlot) {
      setFormError("Elige servicio, día y hora.");
      return;
    }
    startTransition(async () => {
      const res = await createBookingAction({
        tenantSlug,
        serviceId: service.id,
        startsAtISO: selectedSlot.toISOString(),
        customerName: name,
        customerEmail: email,
        customerPhone: phone || undefined,
        notes: notes || undefined,
      });
      if (res.ok) {
        setBookedDetails({
          serviceName: service.name,
          startsAt: selectedSlot,
          customerName: name.trim(),
        });
        setSuccess(true);
        setName("");
        setEmail("");
        setPhone("");
        setNotes("");
        setSelectedSlot(null);
        await refreshBusy();
      } else {
        setFormError(res.error);
      }
    });
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-ink-900/60 p-10 text-center">
        <h1 className="font-display text-2xl text-white">Reservas en línea</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Para activar el calendario, añade en{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
            .env.local
          </code>{" "}
          la URL de Supabase, la clave anónima y la{" "}
          <strong className="font-medium text-zinc-300">service role key</strong>{" "}
          como{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
            SUPABASE_SERVICE_ROLE_KEY
          </code>
          . Esa clave solo vive en el servidor; no la subas a repositorios
          públicos.
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          Luego ejecuta el SQL de{" "}
          <code className="font-mono text-xs text-zinc-400">
            supabase/schema-bookings.sql
          </code>{" "}
          en el panel de Supabase.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm font-medium text-[#14F195] hover:underline"
        >
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  if (success && bookedDetails) {
    const { serviceName, startsAt, customerName } = bookedDetails;
    const dateLabel = format(startsAt, "EEEE d 'de' MMMM", { locale: es });
    const timeLabel = format(startsAt, "HH:mm", { locale: es });
    const dateCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

    return (
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 px-8 py-10 text-center">
          {/* Check icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
            <svg className="h-7 w-7 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80">
            Confirmada
          </p>
          <h1 className="mt-2 font-display text-2xl text-white">
            ¡Hasta pronto, {customerName.split(" ")[0]}!
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Tu cita ha sido registrada.
          </p>
        </div>

        {/* Booking details */}
        <div className="mt-3 rounded-2xl border border-white/[0.07] bg-ink-900/50 divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-xs uppercase tracking-wider text-zinc-500">Servicio</span>
            <span className="text-sm font-medium text-zinc-100">{serviceName}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-xs uppercase tracking-wider text-zinc-500">Fecha</span>
            <span className="text-sm font-medium text-zinc-100">{dateCap}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-xs uppercase tracking-wider text-zinc-500">Hora</span>
            <span className="text-sm font-medium text-zinc-100">{timeLabel}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => { setSuccess(false); setBookedDetails(null); }}
            className="flex-1 rounded-full border border-white/15 py-3 text-sm text-zinc-200 hover:bg-white/5 transition"
          >
            Nueva reserva
          </button>
          <Link
            href="/"
            className="flex-1 rounded-full bg-[#14F195] py-3 text-center text-sm font-semibold text-ink-950 hover:opacity-90 transition"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
      <div>
        <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
          Reserva tu cita
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Elige servicio, día y hora. Las franjas respetan la duración del
          tratamiento y las citas ya confirmadas.
        </p>

        {services.length === 0 ? (
          <p className="mt-8 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-sm text-amber-200/90">
            No hay servicios en la base de datos. Ejecuta el SQL de ejemplo en
            Supabase o inserta filas en{" "}
            <code className="font-mono text-xs">bookido_services</code> para el
            tenant{" "}
            <code className="font-mono text-xs">{tenantSlug}</code>.
          </p>
        ) : (
          <>
            <label className="mt-8 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Servicio
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm text-white outline-none ring-[#14F195]/25 focus:ring-2"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.duration_minutes} min
                </option>
              ))}
            </select>

            <label className="mt-8 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Día
            </label>
            <div className="mt-3 flex justify-center rounded-2xl border border-white/[0.08] bg-ink-900/40 p-4 sm:justify-start">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
                locale={es}
                weekStartsOn={1}
                className="bookido-calendar"
                disabled={(date) =>
                  isBefore(startOfDay(date), todayStart) ||
                  isAfter(startOfDay(date), maxDay)
                }
              />
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-ink-900/30 p-6 md:p-8">
        <h2 className="font-display text-xl text-white">Horario</h2>
        {!selectedDate || !service ? (
          <p className="mt-4 text-sm text-zinc-500">
            Selecciona un servicio y un día en el calendario.
          </p>
        ) : (
          <>
            {busyError && (
              <p className="mt-4 text-sm text-red-400">{busyError}</p>
            )}
            {slotLoading && (
              <p className="mt-4 text-sm text-zinc-500">Cargando franjas…</p>
            )}
            {!slotLoading && !busyError && slots.length === 0 && (
              <p className="mt-4 text-sm text-zinc-500">
                No quedan huecos ese día con la duración elegida. Prueba otro
                día.
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot) => {
                const active = selectedSlot?.getTime() === slot.getTime();
                return (
                  <button
                    key={slot.toISOString()}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "border-[#14F195]/50 bg-[#14F195]/15 text-[#14F195]"
                        : "border-white/10 bg-ink-950/50 text-zinc-300 hover:border-white/20"
                    }`}
                  >
                    {format(slot, "HH:mm", { locale: es })}
                  </button>
                );
              })}
            </div>

            <form onSubmit={onSubmit} className="mt-10 space-y-4 border-t border-white/10 pt-8">
              <h3 className="font-display text-lg text-white">Tus datos</h3>
              <div>
                <label className="text-xs uppercase tracking-wider text-zinc-500">
                  Nombre
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white outline-none ring-[#14F195]/25 focus:ring-2"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-zinc-500">
                  Correo
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white outline-none ring-[#14F195]/25 focus:ring-2"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-zinc-500">
                  Teléfono (opcional)
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white outline-none ring-[#14F195]/25 focus:ring-2"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-zinc-500">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-ink-950 px-4 py-2.5 text-sm text-white outline-none ring-[#14F195]/25 focus:ring-2"
                />
              </div>
              {formError && (
                <p className="text-sm text-red-400">{formError}</p>
              )}
              <button
                type="submit"
                disabled={isPending || !selectedSlot}
                className="w-full rounded-full bg-[#14F195] py-3.5 text-sm font-medium text-[#0A0A0F] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? "Enviando…" : "Confirmar reserva"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
