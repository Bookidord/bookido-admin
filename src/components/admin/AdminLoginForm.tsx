"use client";

import { useState } from "react";
import { useActionState } from "react";
import { adminLoginAction } from "@/app/admin/login/actions";

export function AdminLoginForm() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [state, action, pending] = useActionState(adminLoginAction, null);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-ink-900/50 p-8 backdrop-blur-sm">
      {mode === "password" ? (
        <form action={action} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="admin@bookido.online"
              className="w-full rounded-xl border border-white/[0.07] bg-ink-950/80 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/[0.07] bg-ink-950/80 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          {state?.error && (
            <p className="rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40"
          >
            {pending ? "Verificando…" : "Entrar"}
          </button>

          <p className="pt-1 text-center">
            <button
              type="button"
              onClick={() => setMode("magic")}
              className="text-xs text-zinc-600 underline-offset-2 hover:text-zinc-400 transition"
            >
              Entrar con magic link
            </button>
          </p>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              Email
            </label>
            <input
              type="email"
              autoFocus
              placeholder="admin@bookido.online"
              className="w-full rounded-xl border border-white/[0.07] bg-ink-950/80 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          <p className="rounded-xl border border-white/[0.06] bg-ink-950/40 px-4 py-3 text-xs text-zinc-600 leading-relaxed">
            Magic link no disponible para cuentas de administrador.
          </p>

          <p className="text-center">
            <button
              type="button"
              onClick={() => setMode("password")}
              className="text-xs text-zinc-600 underline-offset-2 hover:text-zinc-400 transition"
            >
              ← Usar contraseña
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
