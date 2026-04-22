"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { registrarNegocioAction, checkSlugAvailableAction } from "@/app/registro/actions";

const TEMPLATES = [
  { id: "nail_studio", label: "💅 Nail Studio" },
  { id: "salon",       label: "💇 Salón de Belleza" },
  { id: "barbershop",  label: "✂️ Barbería" },
  { id: "spa",         label: "🧖 Spa / Bienestar" },
  { id: "restaurant",  label: "🍽️ Restaurante" },
];

const INPUT = "w-full rounded-xl border border-white/[0.08] bg-ink-950/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-[#14F195]/40 focus:ring-1 focus:ring-[#14F195]/20";

function slugify(v: string) {
  return v.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export function RegistroForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName]             = useState("");
  const [slug, setSlug]             = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [template, setTemplate]     = useState("nail_studio");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [whatsapp, setWhatsapp]     = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle"|"checking"|"ok"|"taken">("idle");
  const slugTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!slugEdited && name) setSlug(slugify(name));
  }, [name, slugEdited]);

  useEffect(() => {
    if (!slug) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    if (slugTimer.current) clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(async () => {
      const { available } = await checkSlugAvailableAction(slug);
      setSlugStatus(available ? "ok" : "taken");
    }, 500);
    return () => { if (slugTimer.current) clearTimeout(slugTimer.current); };
  }, [slug]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await registrarNegocioAction({ business_name: name, slug, template, email, password, whatsapp: whatsapp || undefined });
      if (!res.ok) { setError(res.error); return; }
      window.location.href = res.redirectUrl;
    });
  }

  const slugIndicator = slugStatus === "checking" ? (
    <span className="text-zinc-500 text-xs">Verificando…</span>
  ) : slugStatus === "ok" ? (
    <span className="text-emerald-400 text-xs">✓ Disponible</span>
  ) : slugStatus === "taken" ? (
    <span className="text-red-400 text-xs">✗ Ya está en uso</span>
  ) : null;

  return (
    <form onSubmit={submit} className="space-y-4">

      {/* Tipo */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-2">Tipo de negocio</label>
        <div className="grid grid-cols-1 gap-1.5">
          {TEMPLATES.map(t => (
            <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition text-left ${
                template === t.id
                  ? "border-[#14F195]/30 bg-[#14F195]/[0.06] text-white"
                  : "border-white/[0.05] text-zinc-500 hover:border-white/10 hover:text-zinc-300"
              }`}>
              {t.label}
              {template === t.id && <span className="ml-auto text-[#14F195] text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Nombre del negocio</label>
        <input required value={name} onChange={e => setName(e.target.value)}
          placeholder="Mi Nail Studio" className={INPUT} />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Tu subdominio</label>
        <div className="flex items-center rounded-xl border border-white/[0.08] bg-ink-950/60 overflow-hidden focus-within:border-[#14F195]/40 transition">
          <span className="px-3 text-sm text-zinc-600 border-r border-white/[0.06] py-3 flex-shrink-0">bookido.online/</span>
          <input required value={slug}
            onChange={e => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
            placeholder="mi-negocio"
            className="flex-1 bg-transparent px-3 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none" />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-zinc-600">Tus clientes reservarán en <span className="text-zinc-400">{slug || "mi-negocio"}.bookido.online</span></p>
          {slugIndicator}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Correo electrónico</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="tu@correo.com" className={INPUT} />
      </div>

      {/* Password */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">Contraseña</label>
        <div className="relative">
          <input required type={showPass ? "text" : "password"} minLength={8}
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres" className={INPUT + " pr-10"} />
          <button type="button" onClick={() => setShowPass(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition text-xs">
            {showPass ? "Ocultar" : "Ver"}
          </button>
        </div>
      </div>

      {/* WhatsApp */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
          WhatsApp <span className="normal-case font-normal text-zinc-700">(opcional)</span>
        </label>
        <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
          placeholder="+18095550000" className={INPUT} />
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      <button type="submit"
        disabled={pending || slugStatus === "taken" || slugStatus === "checking"}
        className="w-full rounded-xl bg-[#14F195] py-3.5 text-sm font-bold text-[#0A0A0F] transition hover:opacity-90 disabled:opacity-40">
        {pending ? "Creando tu panel…" : "Crear mi panel gratis →"}
      </button>

      <p className="text-center text-xs text-zinc-700">14 días gratis · Sin tarjeta de crédito</p>
    </form>
  );
}
