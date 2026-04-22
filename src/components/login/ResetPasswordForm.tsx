"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    // Listener for implicit-flow (#access_token fragment) — kept for backwards compat
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // PKCE flow: /auth/callback already exchanged the code and set a session cookie.
    // Just verify the session is active and show the form.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/panel"), 2500);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-5 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-3 text-sm font-medium text-emerald-300">Contraseña actualizada</p>
        <p className="mt-2 text-xs text-zinc-400">
          Redirigiendo al panel…
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-5 text-center">
        <p className="text-sm text-amber-200/90">
          Verificando enlace de recuperación…
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Si llegaste aquí directamente, abre el enlace del correo que te enviamos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Nueva contraseña
        </label>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 ring-[#14F195]/25 focus:ring-2 transition"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Confirmar contraseña
        </label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 ring-[#14F195]/25 focus:ring-2 transition"
          placeholder="Repite la contraseña"
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
        {loading ? "Guardando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
