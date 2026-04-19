"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo },
    );

    setLoading(false);

    if (authError) {
      setError("No pudimos enviar el correo. Verifica la dirección e inténtalo de nuevo.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-5 text-center">
        <p className="text-2xl">📬</p>
        <p className="mt-3 text-sm font-medium text-emerald-300">Correo enviado</p>
        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
          Si <span className="text-zinc-200">{email}</span> tiene una cuenta,
          recibirás un enlace para restablecer tu contraseña en los próximos minutos.
        </p>
        <p className="mt-3 text-xs text-zinc-600">
          Revisa también la carpeta de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Correo electrónico
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 ring-[#14F195]/25 focus:ring-2 transition"
          placeholder="hola@ejemplo.com"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[#14F195] py-3.5 text-sm font-semibold text-ink-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Enviando…" : "Enviar enlace de recuperación"}
      </button>
    </form>
  );
}
