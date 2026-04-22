"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format, addDays, startOfDay, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { getBusyForDateAction, createManualBookingAction } from "@/app/panel/reservas/nueva/actions";
import { generateSlots } from "@/lib/slots";

type Service = { id: string; name: string; duration_minutes: number };

type Props = {
  services: Service[];
  openHour: number;
  closeHour: number;
  slotMinutes: number;
};

export function NuevaReservaForm({ services, openHour, closeHour, slotMinutes }: Props) {
  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");
  const maxStr = format(addDays(today, 60), "yyyy-MM-dd");

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [dateStr, setDateStr] = useState(format(addDays(today, 1), "yyyy-MM-dd"));
  const [busy, setBusy] = useState<{ starts_at: string; ends_at: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);

  useEffect(() => {
    if (!dateStr) return;
    setSelectedSlot(null);
    setSlotsLoading(true);
    getBusyForDateAction(dateStr).then((res) => {
      setSlotsLoading(false);
      setBusy(res.ok ? res.intervals : []);
    });
  }, [dateStr, serviceId]);

  const slots = useMemo(() => {
    if (!dateStr || !service) return [];
    return generateSlots(new Date(dateStr), service.duration_minutes, busy, openHour, closeHour, slotMinutes);
  }, [dateStr, service, busy, openHour, closeHour, slotMinutes]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !service) {
      setFormError("Elige servicio, día y hora.");
      return;
    }
    if (!name.trim()) {
      setFormError("El nombre del cliente es obligatorio.");
      return;
    }
    setFormError(null);
    startTransition(async () => {
      await createManualBookingAction({
        serviceId: service.id,
        startsAtISO: selectedSlot.toISOString(),
        customerName: name.trim(),
        customerPhone: phone.trim(),
        notes: notes.trim(),
      });
    });
  }

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-5 text-sm text-amber-200/90">
        No hay servicios configurados. Añade al menos uno en{" "}
        <a href="/panel/servicios" className="underline hover:text-amber-100 transition">Servicios</a>.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client name */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
          Nombre del cliente <span className="text-zinc-500">*</span>
        </label>
        <input
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
          placeholder="María García"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
          Teléfono <span className="text-zinc-600 normal-case">(opcional)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="off"
          className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
          placeholder="+1 809 000 0000"
        />
      </div>

      {/* Service */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
          Servicio <span className="text-zinc-500">*</span>
        </label>
        <select
          value={serviceId}
          onChange={(e) => { setServiceId(e.target.value); setSelectedSlot(null); }}
          className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.duration_minutes} min
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
          Fecha <span className="text-zinc-500">*</span>
        </label>
        <input
          type="date"
          required
          value={dateStr}
          min={todayStr}
          max={maxStr}
          onChange={(e) => { setDateStr(e.target.value); setSelectedSlot(null); }}
          className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition [color-scheme:dark]"
        />
      </div>

      {/* Time slots */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
          Hora <span className="text-zinc-500">*</span>
        </label>

        {slotsLoading ? (
          <p className="text-sm text-zinc-500">Cargando franjas disponibles…</p>
        ) : !dateStr ? (
          <p className="text-sm text-zinc-600">Selecciona una fecha primero.</p>
        ) : slots.length === 0 ? (
          <p className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-sm text-amber-200/80">
            No hay franjas disponibles ese día. Prueba con otra fecha.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {slots.map((slot) => {
              const active = selectedSlot?.getTime() === slot.getTime();
              const isPast = isBefore(slot, new Date());
              return (
                <button
                  key={slot.toISOString()}
                  type="button"
                  disabled={isPast}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition ${
                    isPast
                      ? "cursor-not-allowed border-white/[0.05] text-zinc-700"
                      : active
                      ? "border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195]"
                      : "border-white/10 bg-ink-950/50 text-zinc-300 hover:border-white/20 hover:bg-ink-900"
                  }`}
                >
                  {format(slot, "HH:mm", { locale: es })}
                </button>
              );
            })}
          </div>
        )}

        {selectedSlot && (
          <p className="mt-2 text-xs text-emerald-400">
            Seleccionado:{" "}
            <span className="font-semibold">
              {format(selectedSlot, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
            </span>
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
          Notas <span className="text-zinc-600 normal-case">(opcional)</span>
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full resize-none rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
          placeholder="Preferencias, alergias, color elegido…"
        />
      </div>

      {formError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {formError}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={pending || !selectedSlot}
          className="flex-1 rounded-full bg-[#14F195] py-3.5 text-sm font-medium text-[#0A0A0F] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Confirmar reserva"}
        </button>
        <a
          href="/panel/reservas"
          className="flex-1 rounded-full border border-white/10 py-3.5 text-center text-sm text-zinc-400 transition hover:text-white sm:flex-none sm:px-6"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
