"use client";

import { useState, useId } from "react";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

interface SuccessState {
  subdomain: string;
  slug: string;
}

export function RegistroForm() {
  const id = useId();

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName]       = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [slug, setSlug]                 = useState("");
  const [slugEdited, setSlugEdited]     = useState(false);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<SuccessState | null>(null);

  function handleBusinessNameChange(val: string) {
    setBusinessName(val);
    if (!slugEdited) {
      setSlug(toSlug(val));
    }
  }

  function handleSlugChange(val: string) {
    const clean = val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    setSlug(clean);
    setSlugEdited(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          business_name: businessName,
          owner_name: ownerName,
          owner_email: email,
          owner_password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Error inesperado. Intenta de nuevo.");
        return;
      }

      setSuccess({ subdomain: data.subdomain, slug: data.slug });
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl">
          🎉
        </div>
        <h2 className="font-future text-2xl font-semibold text-white">
          ¡Tu panel está listo!
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          Hemos creado tu espacio en Bookido. Ya puedes entrar a tu panel y
          agregar tus servicios.
        </p>

        <div className="my-6 rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Tu dirección exclusiva
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-emerald-300 break-all">
            {success.subdomain}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={`${success.subdomain}/panel`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#14F195] px-5 py-3 text-sm font-semibold text-ink-950 transition hover:brightness-110"
          >
            Ir a mi panel →
          </a>
          <a
            href={`${success.subdomain}/reserva`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-transparent px-5 py-3 text-sm text-zinc-400 transition hover:text-white"
          >
            Ver mi página de reservas
          </a>
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          Guarda este enlace — es tu acceso para siempre:{" "}
          <span className="text-zinc-400">{success.subdomain}/panel</span>
        </p>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  const slugPreview = slug ? `${slug}.bookido.online` : "tunegocio.bookido.online";
  const slugValid   = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length >= 2;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Business name */}
      <div>
        <label
          htmlFor={`${id}-biz`}
          className="mb-1.5 block text-sm font-medium text-zinc-300"
        >
          Nombre de tu negocio
        </label>
        <input
          id={`${id}-biz`}
          type="text"
          required
          autoComplete="organization"
          placeholder="Yorbana Nail Estudio"
          value={businessName}
          onChange={(e) => handleBusinessNameChange(e.target.value)}
          className="w-full rounded-xl border border-white/[0.08] bg-ink-900/60 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-[#14F195]/30 focus:ring-1 focus:ring-[#14F195]/20"
        />
      </div>

      {/* Owner name */}
      <div>
        <label
          htmlFor={`${id}-owner`}
          className="mb-1.5 block text-sm font-medium text-zinc-300"
        >
          Tu nombre
        </label>
        <input
          id={`${id}-owner`}
          type="text"
          required
          autoComplete="name"
          placeholder="Giolbana Calderón"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          className="w-full rounded-xl border border-white/[0.08] bg-ink-900/60 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-[#14F195]/30 focus:ring-1 focus:ring-[#14F195]/20"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor={`${id}-email`}
          className="mb-1.5 block text-sm font-medium text-zinc-300"
        >
          Correo electrónico
        </label>
        <input
          id={`${id}-email`}
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/[0.08] bg-ink-900/60 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-[#14F195]/30 focus:ring-1 focus:ring-[#14F195]/20"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor={`${id}-pass`}
          className="mb-1.5 block text-sm font-medium text-zinc-300"
        >
          Contraseña
        </label>
        <input
          id={`${id}-pass`}
          type="password"
          required
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-white/[0.08] bg-ink-900/60 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-[#14F195]/30 focus:ring-1 focus:ring-[#14F195]/20"
        />
      </div>

      {/* Subdomain / slug */}
      <div>
        <label
          htmlFor={`${id}-slug`}
          className="mb-1.5 block text-sm font-medium text-zinc-300"
        >
          Subdominio
        </label>
        <div className="flex items-center overflow-hidden rounded-xl border border-white/[0.08] bg-ink-900/60 focus-within:border-[#14F195]/30 focus-within:ring-1 focus-within:ring-[#14F195]/20">
          <input
            id={`${id}-slug`}
            type="text"
            required
            autoComplete="off"
            placeholder="tunegocio"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none"
          />
          <span className="flex-shrink-0 pr-4 text-xs text-zinc-600">
            .bookido.online
          </span>
        </div>

        {/* Live preview */}
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`text-xs ${slugValid ? "text-emerald-400" : "text-zinc-600"}`}
          >
            {slugValid ? "✓" : "○"}
          </span>
          <span className="text-xs text-zinc-500">
            Tu enlace:{" "}
            <span className={`font-mono ${slugValid ? "text-zinc-300" : "text-zinc-600"}`}>
              {slugPreview}
            </span>
          </span>
        </div>
        {slug && !slugValid && (
          <p className="mt-1 text-xs text-amber-400">
            Solo letras minúsculas, números y guiones. Mínimo 2 caracteres.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !slugValid}
        className="mt-2 w-full rounded-xl bg-[#14F195] px-5 py-3.5 text-sm font-semibold text-ink-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creando tu panel…" : "Crear mi panel gratis →"}
      </button>
    </form>
  );
}
