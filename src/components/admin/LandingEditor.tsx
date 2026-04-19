"use client";

import { useState, useTransition, useRef } from "react";
import { saveLandingAction, type LandingFormData } from "@/app/admin/(panel)/clientes/[slug]/landing/actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type LandingRow = {
  is_active: boolean;
  template: string;
  business_name: string;
  tagline: string | null;
  description: string | null;
  whatsapp: string | null;
  address: string | null;
  schedule: string | null;
  hero_color: string;
  photo_url_1: string | null;
  photo_url_2: string | null;
  photo_url_3: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  show_booking_button: boolean;
  custom_cta_text: string;
};

interface Props {
  slug: string;
  landing: LandingRow | null;
  baseDomain: string;
}

// ── Template config ───────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: "nail_studio", label: "Nail Studio",       emoji: "💅", color: "#be185d", desc: "Uñas & nail art" },
  { id: "barbershop",  label: "Barbería",           emoji: "✂️", color: "#3730a3", desc: "Cortes & barba"  },
  { id: "spa",         label: "Spa",                emoji: "🧖", color: "#047857", desc: "Relax & bienestar" },
  { id: "salon",       label: "Salón",              emoji: "💇", color: "#6d28d9", desc: "Cabello & belleza" },
  { id: "restaurant",  label: "Restaurante",        emoji: "🍽️", color: "#b45309", desc: "Comida & bebida"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const TABS = ["Contenido", "Diseño", "Vista previa"] as const;
type Tab = (typeof TABS)[number];

function initialForm(landing: LandingRow | null): LandingFormData {
  return {
    is_active:           landing?.is_active           ?? false,
    template:            landing?.template            ?? "nail_studio",
    business_name:       landing?.business_name       ?? "",
    tagline:             landing?.tagline             ?? "",
    description:         landing?.description         ?? "",
    whatsapp:            landing?.whatsapp            ?? "",
    address:             landing?.address             ?? "",
    schedule:            landing?.schedule            ?? "",
    hero_color:          landing?.hero_color          ?? "#be185d",
    photo_url_1:         landing?.photo_url_1         ?? "",
    photo_url_2:         landing?.photo_url_2         ?? "",
    photo_url_3:         landing?.photo_url_3         ?? "",
    instagram_url:       landing?.instagram_url       ?? "",
    tiktok_url:          landing?.tiktok_url          ?? "",
    facebook_url:        landing?.facebook_url        ?? "",
    show_booking_button: landing?.show_booking_button ?? true,
    custom_cta_text:     landing?.custom_cta_text     ?? "Reservar cita",
  };
}

// ── Toggle switch component ───────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-indigo-600" : "bg-zinc-700"
        }`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</label>
      {hint && <p className="mb-2 text-xs text-zinc-600">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-400/40";

const textareaCls =
  "w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-400/40 resize-none";

// ── Main component ────────────────────────────────────────────────────────────

export function LandingEditor({ slug, landing, baseDomain }: Props) {
  const [tab, setTab] = useState<Tab>("Contenido");
  const [form, setForm] = useState<LandingFormData>(() => initialForm(landing));
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [previewWidth, setPreviewWidth] = useState<375 | 1280>(375);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewUrl =
    typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? `https://${slug}.${baseDomain}`
      : "http://localhost:3000";

  function set<K extends keyof LandingFormData>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };
  }

  function handleSave() {
    setResult(null);
    startTransition(async () => {
      const res = await saveLandingAction(slug, form);
      setResult(res);
    });
  }

  function reloadPreview() {
    if (iframeRef.current) {
      iframeRef.current.src = previewUrl;
    }
  }

  return (
    <div>
      {/* ── Tab nav ────────────────────────────────────────────── */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/[0.07] bg-ink-900/40 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === t
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Contenido ───────────────────────────────────── */}
      {tab === "Contenido" && (
        <div className="space-y-6">
          {/* Active toggle */}
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
            <Toggle
              checked={form.is_active}
              onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              label={form.is_active ? "Landing activa — visible al público" : "Landing inactiva — redirige a /reserva"}
            />
          </div>

          {/* Template selector */}
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Tipo de negocio
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, template: tmpl.id }))}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                    form.template === tmpl.id
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-white/[0.07] hover:border-white/20"
                  }`}
                >
                  <span className="text-2xl">{tmpl.emoji}</span>
                  <span className="text-xs font-medium text-zinc-200">{tmpl.label}</span>
                  <span className="text-[10px] text-zinc-600">{tmpl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Core info */}
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Información del negocio
            </p>
            <Field label="Nombre del negocio">
              <input
                className={inputCls}
                value={form.business_name}
                onChange={set("business_name")}
                placeholder="Yorbana Nail Estudio"
              />
            </Field>
            <Field label="Tagline" hint="Una frase corta y memorable (máx. 80 chars)">
              <input
                className={inputCls}
                value={form.tagline}
                onChange={set("tagline")}
                placeholder="Las uñas que mereces, en Santiago"
                maxLength={80}
              />
            </Field>
            <Field label="Descripción" hint="2-3 frases sobre el negocio">
              <textarea
                className={textareaCls}
                rows={3}
                value={form.description}
                onChange={set("description")}
                placeholder="Somos un estudio especializado en..."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dirección">
                <input
                  className={inputCls}
                  value={form.address}
                  onChange={set("address")}
                  placeholder="Gustavo Mejía Ricart, Santiago"
                />
              </Field>
              <Field label="Horario">
                <input
                  className={inputCls}
                  value={form.schedule}
                  onChange={set("schedule")}
                  placeholder="Lun–Sáb 9am–7pm"
                />
              </Field>
            </div>
            <Field label="WhatsApp" hint="Solo números, con código de país (ej. 18096106459)">
              <input
                className={inputCls}
                value={form.whatsapp}
                onChange={set("whatsapp")}
                placeholder="18096106459"
                inputMode="tel"
              />
            </Field>
          </div>

          {/* Social links */}
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Redes sociales (opcional)
            </p>
            <Field label="Instagram URL">
              <input
                className={inputCls}
                value={form.instagram_url}
                onChange={set("instagram_url")}
                placeholder="https://instagram.com/yorbananails"
                type="url"
              />
            </Field>
            <Field label="TikTok URL">
              <input
                className={inputCls}
                value={form.tiktok_url}
                onChange={set("tiktok_url")}
                placeholder="https://tiktok.com/@yorbananails"
                type="url"
              />
            </Field>
            <Field label="Facebook URL">
              <input
                className={inputCls}
                value={form.facebook_url}
                onChange={set("facebook_url")}
                placeholder="https://facebook.com/yorbananails"
                type="url"
              />
            </Field>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Botón de reservas
            </p>
            <Toggle
              checked={form.show_booking_button}
              onChange={(v) => setForm((f) => ({ ...f, show_booking_button: v }))}
              label="Mostrar botón de reservas"
            />
            {form.show_booking_button && (
              <Field label="Texto del botón">
                <input
                  className={inputCls}
                  value={form.custom_cta_text}
                  onChange={set("custom_cta_text")}
                  placeholder="Reservar mi cita"
                />
              </Field>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Diseño ─────────────────────────────────────── */}
      {tab === "Diseño" && (
        <div className="space-y-6">
          {/* Color picker */}
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Color de acento
            </p>
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-white/20 shadow-lg"
                style={{ backgroundColor: form.hero_color }}
              />
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.hero_color}
                  onChange={set("hero_color")}
                  className="h-10 w-16 cursor-pointer rounded-lg border border-white/[0.08] bg-transparent"
                />
                <input
                  type="text"
                  value={form.hero_color}
                  onChange={set("hero_color")}
                  className="w-28 rounded-xl border border-white/[0.08] bg-ink-950/60 px-3 py-2 font-mono text-sm text-white outline-none focus:border-indigo-400/40"
                  placeholder="#be185d"
                  pattern="^#[0-9a-fA-F]{6}$"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-6 gap-2">
              {["#be185d","#7c3aed","#0ea5e9","#059669","#d97706","#dc2626"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, hero_color: c }))}
                  className={`h-7 w-full rounded-lg transition hover:scale-110 ${
                    form.hero_color === c ? "ring-2 ring-white ring-offset-1 ring-offset-zinc-900" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5 space-y-5">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Fotos (URLs de imágenes)
            </p>
            {(["photo_url_1", "photo_url_2", "photo_url_3"] as const).map((key, i) => (
              <div key={key}>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Foto {i + 1}{i === 0 ? " — Hero (fondo principal)" : ""}
                </label>
                <div className="flex items-start gap-3">
                  <input
                    type="url"
                    className={inputCls + " flex-1"}
                    value={form[key]}
                    onChange={set(key)}
                    placeholder="https://... (jpg, png, webp)"
                  />
                  {form[key] && (
                    <div className="h-[46px] w-[46px] flex-shrink-0 overflow-hidden rounded-lg border border-white/[0.08]">
                      <img
                        src={form[key]}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Live preview link */}
          <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-400">
              Ver la página pública en vivo (abre en nueva pestaña)
            </p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl border border-white/[0.07] px-4 py-2 text-sm text-zinc-300 transition hover:text-white"
            >
              Abrir ↗
            </a>
          </div>
        </div>
      )}

      {/* ── TAB 3: Vista previa ────────────────────────────────── */}
      {tab === "Vista previa" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-ink-900/40 p-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewWidth(375)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  previewWidth === 375
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                📱 375px
              </button>
              <button
                type="button"
                onClick={() => setPreviewWidth(1280)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  previewWidth === 1280
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                🖥 1280px
              </button>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-zinc-600">
                Muestra la versión guardada
              </p>
              <button
                type="button"
                onClick={reloadPreview}
                className="rounded-xl border border-white/[0.07] px-3 py-1.5 text-xs text-zinc-400 transition hover:text-white"
              >
                ↺ Recargar
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-900">
            <div
              className="overflow-x-auto"
              style={{ maxHeight: "680px" }}
            >
              <div
                style={{
                  width: previewWidth,
                  minWidth: previewWidth,
                  margin: "0 auto",
                  transformOrigin: "top left",
                  ...(previewWidth === 1280
                    ? { transform: "scale(0.6)", height: "1133px", marginBottom: "-453px" }
                    : {}),
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  width={previewWidth}
                  height={1000}
                  className="border-0 bg-zinc-950"
                  title="Vista previa de la landing"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Save bar (always visible) ───────────────────────────── */}
      <div className="sticky bottom-0 mt-6 rounded-xl border border-white/[0.07] bg-ink-900/90 p-4 backdrop-blur-sm flex items-center justify-between gap-4">
        {result ? (
          <p
            className={`text-sm ${result.ok ? "text-emerald-400" : "text-red-400"}`}
          >
            {result.ok ? "✓" : "✗"} {result.message}
          </p>
        ) : (
          <p className="text-xs text-zinc-600">Los cambios no se guardan automáticamente</p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
