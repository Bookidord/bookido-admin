"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/app/panel/configuracion/actions";
import type { BusinessSettings } from "@/lib/settings";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function hourLabel(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

export function ConfiguracionClient({ initial }: { initial: BusinessSettings }) {
  const [s, setS] = useState<BusinessSettings>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function update<K extends keyof BusinessSettings>(k: K, v: BusinessSettings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveSettingsAction(s);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business name */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
          Nombre del negocio
        </label>
        <input
          required
          type="text"
          value={s.business_name}
          onChange={(e) => update("business_name", e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
          placeholder="Mi Nail Studio"
        />
        <p className="mt-1 text-xs text-zinc-600">
          Se muestra en la página de reservas que ven tus clientes.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
          Descripción corta
        </label>
        <textarea
          rows={2}
          value={s.description}
          onChange={(e) => update("description", e.target.value)}
          className="w-full resize-none rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
          placeholder="Nail estudio especializado en manicura y pedicura..."
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
          WhatsApp de contacto
        </label>
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0 rounded-xl border border-white/10 bg-ink-900 px-3 py-3 text-sm text-zinc-400">
            +1
          </span>
          <input
            type="tel"
            value={s.whatsapp.replace(/^\+?1?/, "")}
            onChange={(e) => update("whatsapp", "1" + e.target.value.replace(/\D/g, ""))}
            className="flex-1 rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
            placeholder="8096106459"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-600">
          Número de Rep. Dominicana. El prefijo +1 se añade automáticamente.
        </p>
      </div>

      {/* Hours */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
          Horario de atención
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="mb-1 text-[11px] text-zinc-600">Apertura</p>
            <select
              value={s.open_hour}
              onChange={(e) => update("open_hour", Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
            >
              {HOURS.filter((h) => h < s.close_hour).map((h) => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </div>
          <span className="mt-5 text-zinc-600">→</span>
          <div className="flex-1">
            <p className="mb-1 text-[11px] text-zinc-600">Cierre</p>
            <select
              value={s.close_hour}
              onChange={(e) => update("close_hour", Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#14F195]/20 focus:border-[#14F195]/30 transition"
            >
              {HOURS.filter((h) => h > s.open_hour).map((h) => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-1 text-xs text-zinc-600">
          Define las franjas horarias disponibles en el calendario de reservas.
        </p>
      </div>

      {/* Primary color */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
          Color principal
        </label>
        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-3">
          {["#14F195","#9945FF","#0EA5E9","#F97316","#EC4899","#be185d","#06B6D4","#F59E0B"].map(hex => (
            <button
              key={hex}
              type="button"
              onClick={() => update("primary_color", hex)}
              title={hex}
              className={`h-7 w-7 rounded-lg border-2 transition ${s.primary_color?.toLowerCase() === hex.toLowerCase() ? "border-white scale-110" : "border-transparent hover:scale-105"}`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={s.primary_color}
            onChange={(e) => update("primary_color", e.target.value)}
            className="h-11 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
          />
          <input
            type="text"
            readOnly
            value={s.primary_color}
            className="w-32 rounded-xl border border-white/10 bg-ink-950/60 px-3 py-3 font-mono text-sm text-zinc-400 outline-none cursor-default"
          />
          <div
            className="h-11 w-11 flex-shrink-0 rounded-xl shadow-inner ring-1 ring-white/10"
            style={{ backgroundColor: s.primary_color }}
          />
          <p className="text-xs text-zinc-600 leading-snug">
            Acento en la<br />página de reservas
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#14F195] px-6 py-3 text-sm font-semibold text-[#0A0A0F] transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Guardado
          </span>
        )}
      </div>
    </form>
  );
}
