"use client";

import { useState, useTransition, useRef } from "react";
import { saveLandingAction, type LandingConfig } from "@/app/panel/configuracion/actions";

const INPUT_CLS = "w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-[#14F195]/30 focus:ring-1 focus:ring-[#14F195]/20";
const BTN_PRIMARY = "rounded-xl bg-[#14F195] px-5 py-2.5 text-sm font-semibold text-[#0A0A0F] transition hover:opacity-90 disabled:opacity-40";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">{children}</label>;
}

// ── Image upload slot ──────────────────────────────────────────────────────────
function ImageSlot({
  url,
  label,
  uploadType,
  slot,
  onUploaded,
  aspect = "square",
}: {
  url: string;
  label: string;
  uploadType: string;
  slot: string;
  onUploaded: (url: string) => void;
  aspect?: "square" | "portrait" | "wide";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass = aspect === "portrait" ? "aspect-[3/4]" : aspect === "wide" ? "aspect-video" : "aspect-square";

  async function handleFile(file: File) {
    setUploading(true); setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("type", uploadType);
    form.append("slot", slot);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) onUploaded(data.url);
      else setError(data.error ?? "Error al subir");
    } catch {
      setError("Error de red");
    } finally { setUploading(false); }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div
        className={`relative ${aspectClass} w-full overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 cursor-pointer group`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover transition group-hover:brightness-75" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.43 11.093" />
            </svg>
            <span className="text-xs">Subir imagen</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#14F195] border-t-transparent" />
          </div>
        )}
        {url && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100 bg-black/40">
            <span className="text-xs font-medium text-white">Cambiar</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export function LandingTab({ config, tenant }: { config: LandingConfig; tenant: string }) {
  const [c, setC] = useState<LandingConfig>({ ...config });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function set<K extends keyof LandingConfig>(k: K, v: LandingConfig[K]) {
    setC(p => ({ ...p, [k]: v }));
    setSaved(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    start(async () => {
      const res = await saveLandingAction(c);
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setError(res.error);
    });
  }

  const previewUrl = process.env.NODE_ENV === "production"
    ? `https://${tenant}.bookido.online`
    : "/";

  return (
    <form onSubmit={submit} className="space-y-10">
      {/* ── Fotos del negocio ──────────────────────────────────────────── */}
      <div>
        <h3 className="mb-1 text-sm font-semibold text-white">Fotos del negocio</h3>
        <p className="mb-5 text-xs text-zinc-500">Sube hasta 6 fotos. La primera aparece en el hero principal.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(["1","2","3","4","5","6"] as const).map((slot) => {
            const key = `photo_url_${slot}` as keyof LandingConfig;
            return (
              <ImageSlot
                key={slot}
                url={(c[key] as string) ?? ""}
                label={slot === "1" ? `Foto ${slot} — Hero` : `Foto ${slot}`}
                uploadType="gallery"
                slot={slot}
                onUploaded={url => set(key, url)}
                aspect="square"
              />
            );
          })}
        </div>
      </div>

      {/* ── Sobre el dueño ────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-1 text-sm font-semibold text-white">Sobre la dueña / el equipo</h3>
        <p className="mb-5 text-xs text-zinc-500">Muestra quién está detrás del negocio. Genera confianza.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-5">
            <div>
              <Label>Nombre</Label>
              <input type="text" value={c.owner_name ?? ""} onChange={e => set("owner_name", e.target.value)}
                placeholder="Ej: María González" className={INPUT_CLS} />
            </div>
            <div>
              <Label>Bio (2-3 oraciones)</Label>
              <textarea value={c.owner_bio ?? ""} onChange={e => set("owner_bio", e.target.value)}
                placeholder="Ej: Con 8 años de experiencia en nail art, me especializo en…"
                rows={4} className={INPUT_CLS + " resize-none"} />
            </div>
            <div>
              <Label>Video de YouTube (URL)</Label>
              <input type="url" value={c.owner_video_url ?? ""} onChange={e => set("owner_video_url", e.target.value)}
                placeholder="https://youtube.com/watch?v=..." className={INPUT_CLS} />
              <p className="mt-1 text-xs text-zinc-600">Pega la URL de un video de YouTube — aparece embebido en la landing.</p>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <ImageSlot
              url={c.owner_photo_url ?? ""}
              label="Foto de la dueña"
              uploadType="owner"
              slot="photo"
              onUploaded={url => set("owner_photo_url", url)}
              aspect="portrait"
            />
          </div>
        </div>
      </div>

      {/* ── Diplomas ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-1 text-sm font-semibold text-white">Certificaciones y diplomas</h3>
        <p className="mb-5 text-xs text-zinc-500">Sube fotos de tus diplomas, certificados o reconocimientos.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ImageSlot
              key={i}
              url={(c.diploma_urls ?? [])[i] ?? ""}
              label={`Diploma ${i + 1}`}
              uploadType="diplomas"
              slot={String(i + 1)}
              onUploaded={url => {
                const arr = [...(c.diploma_urls ?? [])];
                arr[i] = url;
                set("diploma_urls", arr);
              }}
              aspect="portrait"
            />
          ))}
        </div>
      </div>

      {/* ── Estadísticas ─────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-1 text-sm font-semibold text-white">Estadísticas</h3>
        <p className="mb-5 text-xs text-zinc-500">Aparecen como contadores animados debajo del hero. Deja en 0 para ocultar.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Años de experiencia</Label>
            <input type="number" min={0} max={99} value={c.stats_years ?? 0}
              onChange={e => set("stats_years", parseInt(e.target.value) || 0)}
              className={INPUT_CLS} />
          </div>
          <div>
            <Label>Clientes atendidos</Label>
            <input type="number" min={0} max={99999} value={c.stats_clients ?? 0}
              onChange={e => set("stats_clients", parseInt(e.target.value) || 0)}
              className={INPUT_CLS} />
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-6">
        <a href={previewUrl} target="_blank" rel="noopener noreferrer"
          className="text-sm text-zinc-500 transition hover:text-zinc-300">
          Ver landing →
        </a>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs font-medium text-[#14F195]">✓ Guardado</span>
          )}
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button type="submit" disabled={pending} className={BTN_PRIMARY}>
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}
