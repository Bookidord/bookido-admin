"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import {
  saveNegocioAction,
  saveHorariosAction,
  savePoliciesAction,
  saveTemplateAction,
  saveSpecialDayAction,
  deleteSpecialDayAction,
  type DayHours,
  type BookingPolicies,
  type MessageTemplate,
} from "@/app/panel/configuracion/actions";
import type { BusinessSettings } from "@/lib/settings";
import { CopyLinkButton } from "./CopyLinkButton";
import { LandingTab } from "./LandingTab";
import type { LandingConfig } from "@/app/panel/configuracion/actions";

// ─── Shared helpers ────────────────────────────────────────────────────────────
function SaveBadge({ show }: { show: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-[#14F195]/20 bg-[#14F195]/10 px-2.5 py-0.5 text-xs font-medium text-[#14F195] transition-all duration-200 ${show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
      Guardado
    </span>
  );
}

function FieldInput({ label, value, onChange, type = "text", placeholder, hint, mono = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string; mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-[#14F195]/30 focus:ring-1 focus:ring-[#14F195]/20 ${mono ? "font-mono" : ""}`}
      />
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

const INPUT_CLS = "w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-[#14F195]/30 focus:ring-1 focus:ring-[#14F195]/20";
const BTN_PRIMARY = "rounded-xl bg-[#14F195] px-5 py-2.5 text-sm font-semibold text-[#0A0A0F] transition hover:opacity-90 disabled:opacity-40";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const TEMPLATE_LABELS: Record<string, string> = {
  confirmation:   "Confirmación de reserva",
  reminder_24h:   "Recordatorio 24h antes",
  cancellation:   "Reserva cancelada",
  thank_you:      "Gracias por tu visita",
  review_request: "Solicitud de reseña",
};

const TEMPLATE_VARS = "{nombre}, {servicio}, {fecha}, {hora}, {negocio}, {duracion}, {precio}, {direccion}";

// ─── Tab 1: Negocio ────────────────────────────────────────────────────────────
function TabNegocio({ settings, onSaved }: {
  settings: BusinessSettings & { logo_url?: string | null; address?: string | null; legal_name?: string | null; tax_id?: string | null; hero_copy?: string | null };
  onSaved: () => void;
}) {
  const [s, setS] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function set(k: string, v: string) { setS(p => ({ ...p, [k]: v })); setSaved(false); }

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    start(async () => {
      const res = await saveNegocioAction(s as Parameters<typeof saveNegocioAction>[0]);
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); onSaved(); }
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldInput label="Nombre del negocio" value={s.business_name} onChange={v => set("business_name", v)} placeholder="Mi Nail Studio" hint="Aparece en la página de reservas." />
        <FieldInput label="WhatsApp (E.164)" value={s.whatsapp} onChange={v => set("whatsapp", v)} placeholder="+18095550000" mono />
      </div>
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Descripción corta</label>
        <textarea rows={2} value={s.description} onChange={e => set("description", e.target.value)}
          className={INPUT_CLS + " resize-none"} placeholder="Especialistas en manicura y pedicura..." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldInput label="Dirección" value={s.address ?? ""} onChange={v => set("address", v)} placeholder="Calle Principal 123, Santo Domingo" />
        {/* Color de marca — visual picker */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Color de marca</label>
          {/* Native picker + hex label */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <label className="relative h-10 w-10 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/[0.12]" style={{ backgroundColor: s.primary_color }}>
              <input
                type="color"
                value={s.primary_color}
                onChange={e => set("primary_color", e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            <span className="font-mono text-[13px] text-zinc-400 select-all">{s.primary_color}</span>
          </div>
          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {["#14F195","#9945FF","#E24B4A","#EF9F27","#378ADD","#1D9E75","#D4537E","#5F5E5A"].map(hex => (
              <button
                key={hex}
                type="button"
                onClick={() => set("primary_color", hex)}
                title={hex}
                className="h-6 w-6 flex-shrink-0 rounded-full border border-white/[0.15] transition-transform hover:scale-110 focus:outline-none"
                style={{ backgroundColor: hex, outline: s.primary_color?.toLowerCase() === hex.toLowerCase() ? `2px solid ${hex}` : undefined, outlineOffset: "2px" }}
              />
            ))}
          </div>
          {/* Live preview */}
          <button
            type="button"
            className="h-9 rounded-full px-4 text-sm font-medium transition hover:brightness-110"
            style={{ backgroundColor: s.primary_color, color: "#0A0A0F" }}
          >
            Vista previa
          </button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldInput label="Nombre legal" value={s.legal_name ?? ""} onChange={v => set("legal_name", v)} placeholder="Mi Negocio SRL" />
        <FieldInput label="RNC / Tax ID" value={s.tax_id ?? ""} onChange={v => set("tax_id", v)} placeholder="1-23-45678-9" mono />
      </div>
      <FieldInput label="URL del logo" value={s.logo_url ?? ""} onChange={v => set("logo_url", v)} placeholder="https://..." hint="PNG o SVG, fondo transparente recomendado." />
      <FieldInput label="Texto hero (página pública)" value={s.hero_copy ?? ""} onChange={v => set("hero_copy", v)} placeholder="Tu salón de confianza en Santo Domingo" />

      {error && <p className="rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-2.5 text-sm text-red-300">{error}</p>}
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>{pending ? "Guardando…" : "Guardar"}</button>
        <SaveBadge show={saved} />
        <span className="text-[11px] text-zinc-700">⌘S</span>
      </div>
    </form>
  );
}

// ─── Tab 2: Horarios ───────────────────────────────────────────────────────────
function TabHorarios({ initialHours, specialDays }: {
  initialHours: DayHours[];
  specialDays: { date: string; is_closed: boolean; reason: string; reason_detail: string | null }[];
}) {
  const [hours, setHours] = useState<DayHours[]>(
    Array.from({ length: 7 }, (_, i) => {
      const found = initialHours.find(h => h.day_of_week === i);
      return found ?? { day_of_week: i, is_open: i >= 1 && i <= 6, slots: [{ open: "09:00", close: "18:00" }] };
    })
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Special days
  const [sdList, setSdList] = useState(specialDays);
  const [sdDate, setSdDate] = useState("");
  const [sdReason, setSdReason] = useState("feriado");
  const [sdDetail, setSdDetail] = useState("");
  const [sdPending, startSd] = useTransition();

  function updateSlot(dow: number, idx: number, field: "open" | "close", val: string) {
    setHours(prev => prev.map(d => d.day_of_week !== dow ? d : {
      ...d, slots: d.slots.map((s, i) => i === idx ? { ...s, [field]: val } : s),
    }));
    setSaved(false);
  }

  function addSlot(dow: number) {
    setHours(prev => prev.map(d => d.day_of_week !== dow ? d : {
      ...d, slots: [...d.slots, { open: "09:00", close: "18:00" }],
    }));
  }

  function removeSlot(dow: number, idx: number) {
    setHours(prev => prev.map(d => d.day_of_week !== dow ? d : {
      ...d, slots: d.slots.filter((_, i) => i !== idx),
    }));
  }

  function toggleBreak(dow: number) {
    setHours(prev => prev.map(d => {
      if (d.day_of_week !== dow) return d;
      if (d.slots.length === 2) {
        // Merge back to 1 slot
        return { ...d, slots: [{ open: d.slots[0].open, close: d.slots[1].close }] };
      }
      // Split first slot into 2 with a break
      const first = d.slots[0];
      const [openH] = first.open.split(":").map(Number);
      const [closeH] = first.close.split(":").map(Number);
      const mid = Math.floor((openH + closeH) / 2);
      const midStr = `${String(mid).padStart(2,"0")}:00`;
      const breakEnd = `${String(mid + 1).padStart(2,"0")}:00`;
      return { ...d, slots: [{ open: first.open, close: midStr }, { open: breakEnd, close: first.close }] };
    }));
    setSaved(false);
  }

  function toggleDay(dow: number) {
    setHours(prev => prev.map(d => d.day_of_week !== dow ? d : { ...d, is_open: !d.is_open }));
    setSaved(false);
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await saveHorariosAction(hours);
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setError(res.error);
    });
  }

  function addSpecialDay() {
    if (!sdDate) return;
    startSd(async () => {
      const res = await saveSpecialDayAction({ date: sdDate, is_closed: true, reason: sdReason, reason_detail: sdDetail || undefined });
      if (res.ok) { setSdList(p => [...p.filter(x => x.date !== sdDate), { date: sdDate, is_closed: true, reason: sdReason, reason_detail: sdDetail || null }].sort((a, b) => a.date.localeCompare(b.date))); setSdDate(""); setSdDetail(""); }
    });
  }

  function removeSpecialDay(date: string) {
    startSd(async () => {
      const res = await deleteSpecialDayAction(date);
      if (res.ok) setSdList(p => p.filter(x => x.date !== date));
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 overflow-hidden">
        {hours.map(day => (
          <div key={day.day_of_week} className={`flex flex-col gap-2 px-5 py-4 border-b border-white/[0.04] last:border-0 ${!day.is_open ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => toggleDay(day.day_of_week)} className="flex items-center gap-3 text-left">
                <span className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${day.is_open ? "bg-[#14F195]/70" : "bg-zinc-700"}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ml-0.5 ${day.is_open ? "translate-x-4" : "translate-x-0"}`} />
                </span>
                <span className="text-sm font-medium text-zinc-200">{DAY_NAMES[day.day_of_week]}</span>
              </button>
              {day.is_open && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleBreak(day.day_of_week)}
                    className={`text-xs transition ${day.slots.length === 2 ? "text-[#14F195]" : "text-zinc-600 hover:text-zinc-400"}`}
                    title={day.slots.length === 2 ? "Quitar pausa" : "Añadir pausa intermedia"}
                  >
                    {day.slots.length === 2 ? "⟳ pausa activa" : "pausa"}
                  </button>
                  <button type="button" onClick={() => addSlot(day.day_of_week)} className="text-xs text-zinc-600 hover:text-[#14F195] transition">+ franja</button>
                </div>
              )}
            </div>
            {day.is_open && day.slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2 pl-12">
                <input type="time" value={slot.open}  onChange={e => updateSlot(day.day_of_week, idx, "open",  e.target.value)} className="rounded-lg border border-white/[0.07] bg-ink-950 px-3 py-1.5 text-sm text-zinc-200 outline-none [color-scheme:dark]" />
                <span className="text-zinc-600 text-xs">–</span>
                <input type="time" value={slot.close} onChange={e => updateSlot(day.day_of_week, idx, "close", e.target.value)} className="rounded-lg border border-white/[0.07] bg-ink-950 px-3 py-1.5 text-sm text-zinc-200 outline-none [color-scheme:dark]" />
                {day.slots.length > 1 && (
                  <button type="button" onClick={() => removeSlot(day.day_of_week, idx)} className="text-zinc-600 hover:text-red-400 transition text-xs">✕</button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {error && <p className="rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-2.5 text-sm text-red-300">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className={BTN_PRIMARY}>{pending ? "Guardando…" : "Guardar horarios"}</button>
        <SaveBadge show={saved} />
      </div>

      {/* Special days */}
      <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-4">Días especiales / feriados</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <input type="date" value={sdDate} onChange={e => setSdDate(e.target.value)}
            className="rounded-xl border border-white/[0.07] bg-ink-950/60 px-3 py-2 text-sm text-zinc-200 outline-none [color-scheme:dark]" />
          <select value={sdReason} onChange={e => setSdReason(e.target.value)}
            className="rounded-xl border border-white/[0.07] bg-ink-950/60 px-3 py-2 text-sm text-zinc-200 outline-none">
            <option value="feriado">Feriado</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="custom">Otro</option>
          </select>
          <input type="text" value={sdDetail} onChange={e => setSdDetail(e.target.value)} placeholder="Detalle (opcional)"
            className="rounded-xl border border-white/[0.07] bg-ink-950/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 outline-none" />
          <button type="button" onClick={addSpecialDay} disabled={!sdDate || sdPending} className={BTN_PRIMARY + " !py-2"}>Agregar</button>
        </div>
        {sdList.length === 0 ? (
          <p className="text-xs text-zinc-600">No hay días especiales configurados.</p>
        ) : (
          <ul className="space-y-2">
            {sdList.map(sd => (
              <li key={sd.date} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-ink-950/40 px-3 py-2">
                <span className="font-mono text-sm text-zinc-300">{sd.date}</span>
                <span className="text-xs text-zinc-500 mx-3">{sd.reason}{sd.reason_detail ? ` · ${sd.reason_detail}` : ""}</span>
                <button type="button" onClick={() => removeSpecialDay(sd.date)} disabled={sdPending} className="text-zinc-600 hover:text-red-400 transition text-xs">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Tab 4: Políticas ──────────────────────────────────────────────────────────
function TabPoliticas({ initial }: { initial: BookingPolicies }) {
  const [p, setP] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function set<K extends keyof BookingPolicies>(k: K, v: BookingPolicies[K]) {
    setP(prev => ({ ...prev, [k]: v })); setSaved(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    start(async () => {
      const res = await savePoliciesAction(p);
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Antelación mínima (horas)</label>
          <input type="number" min={0} max={168} value={p.min_advance_hours} onChange={e => set("min_advance_hours", +e.target.value)}
            className={INPUT_CLS + " font-mono"} />
          <p className="mt-1 text-xs text-zinc-600">Mínimo de horas previas requeridas para reservar.</p>
        </div>
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Anticipación máxima (días)</label>
          <input type="number" min={1} max={365} value={p.max_advance_days} onChange={e => set("max_advance_days", +e.target.value)}
            className={INPUT_CLS + " font-mono"} />
          <p className="mt-1 text-xs text-zinc-600">Con cuántos días de anticipación se puede reservar.</p>
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Política de cancelación</label>
        <textarea rows={3} value={p.cancellation_policy} onChange={e => set("cancellation_policy", e.target.value)}
          className={INPUT_CLS + " resize-none"} placeholder="Cancela con 24h de antelación para recibir reembolso." />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <button type="button" onClick={() => set("require_deposit", !p.require_deposit)}
            className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${p.require_deposit ? "bg-[#14F195]/70" : "bg-zinc-700"}`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ml-0.5 ${p.require_deposit ? "translate-x-4" : "translate-x-0"}`} />
          </button>
          <span className="text-sm text-zinc-300">Requerir depósito</span>
        </label>
        {p.require_deposit && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">RD$</span>
            <input type="number" min={0} value={p.deposit_amount} onChange={e => set("deposit_amount", +e.target.value)}
              className="w-28 rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2 font-mono text-sm text-zinc-100 outline-none" />
          </div>
        )}
      </div>
      {error && <p className="rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-2.5 text-sm text-red-300">{error}</p>}
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>{pending ? "Guardando…" : "Guardar"}</button>
        <SaveBadge show={saved} />
      </div>
    </form>
  );
}

// ─── Tab 5: Mensajes ───────────────────────────────────────────────────────────
function TabMensajes({ initialTemplates }: { initialTemplates: MessageTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [active, setActive] = useState(initialTemplates[0]?.key ?? "confirmation");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const tpl = templates.find(t => t.key === active)!;

  function update(k: keyof MessageTemplate, v: string | boolean) {
    setTemplates(prev => prev.map(t => t.key === active ? { ...t, [k]: v } : t));
    setSaved(false);
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await saveTemplateAction(tpl);
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setError(res.error);
    });
  }

  const preview = tpl.body
    .replace(/\{nombre\}/g, "María García")
    .replace(/\{servicio\}/g, "Manicura gel")
    .replace(/\{fecha\}/g, "25/04/2026")
    .replace(/\{hora\}/g, "10:00 AM")
    .replace(/\{negocio\}/g, "Mi Negocio")
    .replace(/\{duracion\}/g, "60")
    .replace(/\{precio\}/g, "800")
    .replace(/\{direccion\}/g, "Santo Domingo, RD");

  return (
    <div className="space-y-4">
      {/* Template selector */}
      <div className="flex flex-wrap gap-2">
        {templates.map(t => (
          <button key={t.key} type="button" onClick={() => setActive(t.key)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${active === t.key ? "border-[#14F195]/30 bg-[#14F195]/10 text-[#14F195]" : "border-white/[0.08] text-zinc-500 hover:text-zinc-300"}`}>
            {TEMPLATE_LABELS[t.key]}
            {t.enabled ? <span className="h-1.5 w-1.5 rounded-full bg-[#14F195]" /> : <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />}
          </button>
        ))}
      </div>

      {tpl && (
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-200">{TEMPLATE_LABELS[tpl.key]}</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <button type="button" onClick={() => update("enabled", !tpl.enabled)}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${tpl.enabled ? "bg-[#14F195]/70" : "bg-zinc-700"}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ml-0.5 ${tpl.enabled ? "translate-x-4" : "translate-x-0"}`} />
              </button>
              <span className="text-xs text-zinc-500">{tpl.enabled ? "Activo" : "Inactivo"}</span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Canal</label>
              <select value={tpl.channel} onChange={e => update("channel", e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2.5 text-sm text-zinc-200 outline-none">
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="both">WhatsApp + Email</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Asunto (email)</label>
              <input type="text" value={tpl.subject ?? ""} onChange={e => update("subject", e.target.value)}
                placeholder="Asunto del correo"
                className="w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Cuerpo del mensaje</label>
            <textarea rows={5} value={tpl.body} onChange={e => update("body", e.target.value)}
              className="w-full resize-y rounded-xl border border-white/[0.08] bg-ink-950/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-[#14F195]/30 font-mono" />
            <p className="mt-1 text-[11px] text-zinc-600">Variables: {TEMPLATE_VARS}</p>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-white/[0.05] bg-ink-950/60 p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600 mb-2">Vista previa</p>
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{preview}</pre>
          </div>

          {error && <p className="rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-2.5 text-sm text-red-300">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="button" onClick={save} disabled={pending} className={BTN_PRIMARY}>{pending ? "Guardando…" : "Guardar"}</button>
            <SaveBadge show={saved} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main tabbed component ─────────────────────────────────────────────────────
const TABS = [
  { id: "negocio",    label: "Negocio" },
  { id: "horarios",   label: "Horarios" },
  { id: "servicios",  label: "Servicios" },
  { id: "politicas",  label: "Reservas" },
  { id: "mensajes",   label: "Mensajes" },
  { id: "landing",    label: "Landing" },
  { id: "pagina",     label: "Página" },
];

type Props = {
  settings: BusinessSettings & { logo_url?: string | null; address?: string | null; legal_name?: string | null; tax_id?: string | null; hero_copy?: string | null };
  businessHours: DayHours[];
  policies: BookingPolicies;
  templates: MessageTemplate[];
  specialDays: { date: string; is_closed: boolean; reason: string; reason_detail: string | null }[];
  tenant: string;
  bookingUrl: string;
  landingConfig?: LandingConfig | null;
};

export function ConfiguracionTabs({ settings, businessHours, policies, templates, specialDays, tenant, bookingUrl, landingConfig }: Props) {
  const [tab, setTab] = useState("negocio");

  // Cmd+S global shortcut — save active tab form
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        const btn = document.querySelector<HTMLButtonElement>("[data-tab-save]");
        btn?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const savedCallback = useCallback(() => {}, []);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-white/[0.07] scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-5 py-3.5 text-xs font-medium uppercase tracking-wider transition border-b-2 -mb-px ${tab === t.id ? "border-[#14F195] text-[#14F195]" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5 sm:p-6">
        {tab === "negocio" && <TabNegocio settings={settings} onSaved={savedCallback} />}
        {tab === "horarios" && <TabHorarios initialHours={businessHours} specialDays={specialDays} />}
        {tab === "servicios" && (
          <div className="text-sm text-zinc-400">
            <p className="mb-3">Gestiona tus servicios en la sección dedicada:</p>
            <a href="/panel/servicios" className="inline-flex items-center gap-2 rounded-xl bg-[#14F195] px-5 py-2.5 text-sm font-semibold text-[#0A0A0F] transition hover:opacity-90">
              Ir a servicios →
            </a>
          </div>
        )}
        {tab === "politicas" && <TabPoliticas initial={policies} />}
        {tab === "mensajes" && <TabMensajes initialTemplates={templates} />}
        {tab === "landing" && (
          <LandingTab
            config={landingConfig ?? { photo_url_1: null, photo_url_2: null, photo_url_3: null, photo_url_4: null, photo_url_5: null, photo_url_6: null, owner_name: null, owner_bio: null, owner_photo_url: null, owner_video_url: null, diploma_urls: [], stats_years: null, stats_clients: null }}
            tenant={tenant}
          />
        )}
        {tab === "pagina" && (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Tu enlace de reservas</p>
              <CopyLinkButton bookingUrl={bookingUrl} />
              <p className="mt-2 text-xs text-zinc-600">Comparte por WhatsApp, Instagram o donde tus clientes te contacten.</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-2">Tu subdominio</p>
              <p className="font-mono text-sm text-zinc-300">{tenant}.bookido.online</p>
              <p className="mt-1 text-xs text-zinc-600">Dominio exclusivo en Bookido. No se puede cambiar.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
