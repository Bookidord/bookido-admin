"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/panel";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
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

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Contraseña
        </label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 ring-[#14F195]/25 focus:ring-2 transition"
          placeholder="••••••••"
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
        {loading ? "Entrando…" : "Entrar al panel"}
      </button>
    </form>
  );
}
