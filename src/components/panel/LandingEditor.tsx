"use client";

import { useState, useTransition } from "react";
import { saveLandingAction, type LandingInput } from "@/app/panel/landing/actions";

type LandingRow = Partial<LandingInput> & { tenant_slug?: string };

const TEMPLATES = [
  { value: "nail_studio", label: "Nail Studio / Uñas" },
  { value: "salon", label: "Salón de Belleza" },
  { value: "barbershop", label: "Barbería" },
  { value: "spa", label: "Spa / Masajes" },
  { value: "clinica", label: "Clínica / Estética" },
];

const DEFAULTS: LandingInput = {
  is_active: false,
  template: "nail_studio",
  business_name: "",
  tagline: null,
  description: null,
  hero_color: "#ec4899",
  custom_cta_text: "Reservar ahora",
  whatsapp: null,
  address: null,
  schedule: null,
  instagram_url: null,
  tiktok_url: null,
  facebook_url: null,
  photo_url_1: null,
  photo_url_2: null,
  photo_url_3: null,
  photo_url_4: null,
  photo_url_5: null,
  photo_url_6: null,
  owner_name: null,
  owner_bio: null,
  owner_photo_url: null,
  owner_video_url: null,
  diploma_urls: null,
  stats_years: null,
  stats_clients: null,
};

function toForm(data: LandingRow | null): LandingInput {
  if (!data) return { ...DEFAULTS };
  return {
    is_active: data.is_active ?? false,
    template: data.template ?? "nail_studio",
    business_name: data.business_name ?? "",
    tagline: data.tagline ?? null,
    description: data.description ?? null,
    hero_color: data.hero_color ?? "#ec4899",
    custom_cta_text: data.custom_cta_text ?? "Reservar ahora",
    whatsapp: data.whatsapp ?? null,
    address: data.address ?? null,
    schedule: data.schedule ?? null,
    instagram_url: data.instagram_url ?? null,
    tiktok_url: data.tiktok_url ?? null,
    facebook_url: data.facebook_url ?? null,
    photo_url_1: data.photo_url_1 ?? null,
    photo_url_2: data.photo_url_2 ?? null,
    photo_url_3: data.photo_url_3 ?? null,
    photo_url_4: data.photo_url_4 ?? null,
    photo_url_5: data.photo_url_5 ?? null,
    photo_url_6: data.photo_url_6 ?? null,
    owner_name: data.owner_name ?? null,
    owner_bio: data.owner_bio ?? null,
    owner_photo_url: data.owner_photo_url ?? null,
    owner_video_url: data.owner_video_url ?? null,
    diploma_urls: data.diploma_urls ?? null,
    stats_years: data.stats_years ?? null,
    stats_clients: data.stats_clients ?? null,
  };
}

// ── Accordion section ─────────────────────────────────────────────────────────
function Section({ title, hint, children, defaultOpen = false }: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          {hint && <p className="text-xs text-zinc-600 mt-0.5">{hint}</p>}
        </div>
        <svg
          className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="border-t border-white/[0.05] px-4 pb-5 pt-4 space-y-4">{children}</div>}
    </div>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-400">{label}</label>
      {hint && <p className="mb-1.5 text-[10px] text-zinc-600">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-3 text-sm text-zinc-200 outline-none focus:border-[#14F195]/40 placeholder:text-zinc-700";

// ── Main component ────────────────────────────────────────────────────────────
export function LandingEditor({ initialData }: { initialData: LandingRow | null }) {
  const [form, setForm] = useState<LandingInput>(() => toForm(initialData));
  const [diplomas, setDiplomas] = useState<string[]>(initialData?.diploma_urls ?? [""]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof LandingInput>(key: K, val: LandingInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function str(key: keyof LandingInput, val: string) {
    set(key, (val.trim() === "" ? null : val) as LandingInput[typeof key]);
  }

  function handleSave() {
    if (!form.business_name.trim()) { setError("El nombre del negocio es requerido."); return; }
    setError(null);
    const finalDiplomas = diplomas.filter(Boolean);
    startTransition(async () => {
      const res = await saveLandingAction({ ...form, diploma_urls: finalDiplomas.length ? finalDiplomas : null });
      if (!res.ok) { setError(res.error ?? "Error al guardar"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-future text-xl font-semibold text-white">Mi Landing</h1>
          <p className="text-sm text-zinc-500">Personaliza tu página pública.</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-white">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Ver
        </a>
      </div>

      <div className="space-y-3">

        {/* ── Básico ── */}
        <Section title="Básico" defaultOpen={true}>
          {/* Activo toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Landing activa</p>
              <p className="text-xs text-zinc-600">Visible públicamente en tu URL</p>
            </div>
            <button
              type="button"
              onClick={() => set("is_active", !form.is_active)}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.is_active ? "bg-[#14F195]" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          <Field label="Nombre del negocio *">
            <input value={form.business_name} onChange={(e) => set("business_name", e.target.value)}
              className={inputCls} placeholder="La Exótica Nail Studio" />
          </Field>

          <Field label="Tagline" hint="Frase corta debajo del nombre">
            <input value={form.tagline ?? ""} onChange={(e) => str("tagline", e.target.value)}
              className={inputCls} placeholder="Donde tus uñas cobran vida" />
          </Field>

          <Field label="Descripción" hint="Párrafo de bienvenida en el hero">
            <textarea value={form.description ?? ""} onChange={(e) => str("description", e.target.value)}
              rows={3} className={`${inputCls} resize-none`} placeholder="Somos un estudio especializado en..." />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Color principal" hint="Elige el color de tu marca">
              <div className="flex items-center gap-2">
                <input type="color" value={form.hero_color}
                  onChange={(e) => set("hero_color", e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-white/[0.08] bg-transparent p-0.5" />
                <input value={form.hero_color} onChange={(e) => set("hero_color", e.target.value)}
                  className={inputCls} placeholder="#ec4899" />
              </div>
            </Field>

            <Field label="Tipo de negocio">
              <select value={form.template} onChange={(e) => set("template", e.target.value)}
                className={inputCls}>
                {TEMPLATES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Texto del botón de reserva">
            <input value={form.custom_cta_text} onChange={(e) => set("custom_cta_text", e.target.value || "Reservar ahora")}
              className={inputCls} placeholder="Reservar ahora" />
          </Field>
        </Section>

        {/* ── Contacto ── */}
        <Section title="Contacto" hint="WhatsApp, dirección y horario">
          <Field label="WhatsApp" hint="Solo números con código de país, ej: 18091234567">
            <input value={form.whatsapp ?? ""} onChange={(e) => str("whatsapp", e.target.value)}
              className={inputCls} placeholder="18091234567" inputMode="tel" />
          </Field>

          <Field label="Dirección">
            <input value={form.address ?? ""} onChange={(e) => str("address", e.target.value)}
              className={inputCls} placeholder="Av. 27 de Febrero #123, Santo Domingo" />
          </Field>

          <Field label="Horario" hint="Texto libre, ej: Lun–Vie 9am–7pm · Sáb 9am–5pm">
            <input value={form.schedule ?? ""} onChange={(e) => str("schedule", e.target.value)}
              className={inputCls} placeholder="Lun–Sáb 9am–7pm" />
          </Field>
        </Section>

        {/* ── Redes ── */}
        <Section title="Redes Sociales">
          <Field label="Instagram" hint="Solo el usuario, sin @">
            <input value={form.instagram_url ?? ""} onChange={(e) => str("instagram_url", e.target.value)}
              className={inputCls} placeholder="exotica.nails" />
          </Field>

          <Field label="TikTok" hint="Solo el usuario, sin @">
            <input value={form.tiktok_url ?? ""} onChange={(e) => str("tiktok_url", e.target.value)}
              className={inputCls} placeholder="exotica.nails" />
          </Field>

          <Field label="Facebook" hint="Solo el usuario o nombre de la página">
            <input value={form.facebook_url ?? ""} onChange={(e) => str("facebook_url", e.target.value)}
              className={inputCls} placeholder="ExoticaNailStudio" />
          </Field>
        </Section>

        {/* ── Fotos ── */}
        <Section title="Galería de Fotos" hint="Hasta 6 fotos de tu trabajo">
          {([1,2,3,4,5,6] as const).map((n) => {
            const key = `photo_url_${n}` as keyof LandingInput;
            return (
              <Field key={n} label={`Foto ${n}${n <= 3 ? " *" : ""}`} hint="Pega el enlace directo de la imagen">
                <input value={(form[key] as string | null) ?? ""}
                  onChange={(e) => str(key, e.target.value)}
                  className={inputCls} placeholder="https://..." />
              </Field>
            );
          })}
        </Section>

        {/* ── Propietaria ── */}
        <Section title="Sobre la Dueña / Especialista" hint="Sección opcional de presentación personal">
          <Field label="Nombre">
            <input value={form.owner_name ?? ""} onChange={(e) => str("owner_name", e.target.value)}
              className={inputCls} placeholder="María González" />
          </Field>

          <Field label="Bio" hint="Cuéntale a tus clientes quién eres">
            <textarea value={form.owner_bio ?? ""} onChange={(e) => str("owner_bio", e.target.value)}
              rows={3} className={`${inputCls} resize-none`}
              placeholder="Soy técnica en uñas con 8 años de experiencia..." />
          </Field>

          <Field label="Foto de perfil" hint="Enlace directo a tu foto">
            <input value={form.owner_photo_url ?? ""} onChange={(e) => str("owner_photo_url", e.target.value)}
              className={inputCls} placeholder="https://..." />
          </Field>

          <Field label="Video de presentación" hint="Enlace de YouTube (opcional)">
            <input value={form.owner_video_url ?? ""} onChange={(e) => str("owner_video_url", e.target.value)}
              className={inputCls} placeholder="https://youtube.com/watch?v=..." />
          </Field>

          <Field label="Diplomas / Certificaciones" hint="Hasta 3 fotos de tus certificados">
            {diplomas.map((url, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <input value={url} onChange={(e) => setDiplomas((d) => d.map((x, j) => j === i ? e.target.value : x))}
                  className={inputCls} placeholder={`Diploma ${i + 1} — https://...`} />
                {diplomas.length > 1 && (
                  <button type="button" onClick={() => setDiplomas((d) => d.filter((_, j) => j !== i))}
                    className="shrink-0 text-zinc-600 transition hover:text-red-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {diplomas.length < 3 && (
              <button type="button" onClick={() => setDiplomas((d) => [...d, ""])}
                className="text-xs text-zinc-500 transition hover:text-[#14F195]">
                + Agregar diploma
              </button>
            )}
          </Field>
        </Section>

        {/* ── Stats ── */}
        <Section title="Estadísticas" hint="Números que generan confianza">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Años de experiencia">
              <input type="number" min={0} value={form.stats_years ?? ""}
                onChange={(e) => set("stats_years", e.target.value ? +e.target.value : null)}
                className={inputCls} placeholder="8" inputMode="numeric" />
            </Field>

            <Field label="Clientes atendidas">
              <input type="number" min={0} value={form.stats_clients ?? ""}
                onChange={(e) => set("stats_clients", e.target.value ? +e.target.value : null)}
                className={inputCls} placeholder="1200" inputMode="numeric" />
            </Field>
          </div>
        </Section>

      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.07] bg-zinc-950/90 px-4 py-3 backdrop-blur-sm lg:left-14">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          {saved && (
            <p className="text-sm text-[#14F195]">Guardado</p>
          )}
          {!saved && <span />}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-xl bg-[#14F195] px-8 py-3 text-sm font-semibold text-[#0A0A0F] transition hover:bg-[#14F195]/90 disabled:opacity-50"
          >
            {isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
