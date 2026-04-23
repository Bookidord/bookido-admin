"use client";

import { useState, useTransition } from "react";
import { saveClientDateAction, deleteClientDateAction } from "@/app/panel/clientes/[email]/actions";

type DateEntry = {
  id: string;
  date_type: string;
  label: string | null;
  month: number;
  day: number;
};

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const TYPE_OPTIONS = [
  { value: "birthday",    label: "🎂 Cumpleaños" },
  { value: "anniversary", label: "💍 Aniversario" },
  { value: "other",       label: "⭐ Otra fecha" },
];

const TYPE_LABEL: Record<string, string> = {
  birthday:    "🎂 Cumpleaños",
  anniversary: "💍 Aniversario",
  other:       "⭐ Fecha especial",
};

export function ClientDatesPanel({
  customerEmail,
  customerName,
  initialDates,
}: {
  customerEmail: string;
  customerName: string;
  initialDates: DateEntry[];
}) {
  const [dates, setDates] = useState<DateEntry[]>(initialDates);
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    dateType: "birthday",
    label: "",
    month: 1,
    day: 1,
  });
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveClientDateAction({
        customerEmail,
        customerName,
        dateType: form.dateType,
        label: form.dateType === "other" ? form.label || null : null,
        month: form.month,
        day: form.day,
      });
      if (!res.ok) {
        setError(res.error ?? "Error al guardar");
        return;
      }
      setDates((prev) => {
        const filtered = prev.filter((d) => d.date_type !== form.dateType);
        return [
          ...filtered,
          {
            id: crypto.randomUUID(),
            date_type: form.dateType,
            label: form.dateType === "other" ? form.label || null : null,
            month: form.month,
            day: form.day,
          },
        ];
      });
      setAdding(false);
    });
  }

  function handleDelete(id: string, dateType: string) {
    startTransition(async () => {
      const res = await deleteClientDateAction(id);
      if (res.ok) {
        setDates((prev) => prev.filter((d) => d.id !== id));
      }
    });
  }

  const daysInMonth = (m: number) => new Date(2024, m, 0).getDate();

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-future text-base font-semibold text-white">Fechas especiales</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => { setAdding(true); setError(null); }}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.07]"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar
          </button>
        )}
      </div>

      {/* Existing dates */}
      {dates.length > 0 && (
        <div className="mb-3 space-y-2">
          {dates.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-ink-900/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{d.date_type === "birthday" ? "🎂" : d.date_type === "anniversary" ? "💍" : "⭐"}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {d.date_type === "other" && d.label ? d.label : (TYPE_LABEL[d.date_type] ?? "Fecha")}
                  </p>
                  <p className="text-xs text-zinc-500">{d.day} de {MONTHS[d.month - 1]}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDelete(d.id, d.date_type)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.06] hover:text-zinc-400"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {dates.length === 0 && !adding && (
        <p className="rounded-xl border border-white/[0.05] bg-ink-900/30 px-4 py-6 text-center text-sm text-zinc-600">
          Sin fechas especiales registradas
        </p>
      )}

      {/* Add form */}
      {adding && (
        <div className="rounded-xl border border-[#14F195]/20 bg-[#14F195]/[0.03] p-4">
          <p className="mb-3 text-sm font-medium text-zinc-300">Nueva fecha especial</p>

          <div className="space-y-3">
            {/* Type */}
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Tipo</label>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, dateType: o.value }))}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                      form.dateType === o.value
                        ? "border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195]"
                        : "border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom label for "other" */}
            {form.dateType === "other" && (
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Descripción</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Ej: Día de la madre"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-[#14F195]/40"
                />
              </div>
            )}

            {/* Month + Day */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-zinc-500">Mes</label>
                <select
                  value={form.month}
                  onChange={(e) => setForm((f) => ({ ...f, month: +e.target.value, day: 1 }))}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#14F195]/40"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className="mb-1 block text-xs text-zinc-500">Día</label>
                <select
                  value={form.day}
                  onChange={(e) => setForm((f) => ({ ...f, day: +e.target.value }))}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#14F195]/40"
                >
                  {Array.from({ length: daysInMonth(form.month) }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 rounded-lg bg-[#14F195] py-2 text-sm font-semibold text-[#0A0A0F] transition hover:bg-[#14F195]/90 disabled:opacity-50"
              >
                {isPending ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setError(null); }}
                className="rounded-lg border border-white/[0.07] px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.04]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
