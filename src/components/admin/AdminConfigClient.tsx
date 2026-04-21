"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changeAdminPasswordAction, updateAlertDaysAction } from "@/app/admin/(panel)/configuracion/actions";

function SaveBadge({ show }: { show: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300 transition-all duration-200 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Guardado
    </span>
  );
}

type SystemStatus = {
  sqlite: { ok: boolean; businesses: number; reservas: number; leads: number } | null;
  supabase: boolean;
  wa: { connected: boolean; user: string } | null;
  resend: boolean;
  timestamp: string;
};

interface Props {
  alertDays: number;
  adminEmail: string;
  systemStatus?: SystemStatus;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
  );
}

export function AdminConfigClient({ alertDays, adminEmail, systemStatus }: Props) {
  const [pwState, pwAction, pwPending] = useActionState(changeAdminPasswordAction, null);
  const [daysState, daysAction, daysPending] = useActionState(updateAlertDaysAction, null);

  const [pwSaved, setPwSaved] = useState(false);
  const [daysSaved, setDaysSaved] = useState(false);

  const pwFormRef = useRef<HTMLFormElement>(null);
  const daysFormRef = useRef<HTMLFormElement>(null);

  // Badge flash on success
  useEffect(() => {
    if (pwState?.ok) {
      setPwSaved(true);
      const t = setTimeout(() => setPwSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [pwState]);

  useEffect(() => {
    if (daysState?.ok) {
      setDaysSaved(true);
      const t = setTimeout(() => setDaysSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [daysState]);

  // Cmd+S / Ctrl+S global shortcut — submits focused form
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        // Try to find the active form by focus within
        if (pwFormRef.current?.contains(document.activeElement)) {
          pwFormRef.current.requestSubmit();
        } else if (daysFormRef.current?.contains(document.activeElement)) {
          daysFormRef.current.requestSubmit();
        } else {
          // Default: submit days form (most common save target)
          daysFormRef.current?.requestSubmit();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="space-y-5">
      {/* Admin info */}
      <div className="rounded-xl border border-white/[0.06] bg-ink-900/40 p-5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600 mb-3">
          Cuenta de administrador
        </p>
        <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Email</p>
        <p className="mt-1 font-mono text-sm text-zinc-300">{adminEmail}</p>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-white/[0.06] bg-ink-900/40 p-5">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            Cambiar contraseña
          </p>
          <SaveBadge show={pwSaved} />
        </div>
        <form ref={pwFormRef} action={pwAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              Nueva contraseña
            </label>
            <input
              name="new_password"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-white/[0.07] bg-ink-950/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              Confirmar contraseña
            </label>
            <input
              name="confirm_password"
              type="password"
              required
              minLength={8}
              placeholder="Repite la contraseña"
              className="w-full rounded-xl border border-white/[0.07] bg-ink-950/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          {pwState && !pwState.ok && (
            <p className="rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-2.5 text-sm text-red-300">
              {pwState.message}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pwPending}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40"
            >
              {pwPending ? "Guardando…" : "Actualizar"}
            </button>
            <span className="text-[11px] text-zinc-700">⌘S</span>
          </div>
        </form>
      </div>

      {/* Alert days */}
      <div className="rounded-xl border border-white/[0.06] bg-ink-900/40 p-5">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            Aviso de vencimiento
          </p>
          <SaveBadge show={daysSaved} />
        </div>
        <p className="mb-4 text-sm text-zinc-600">
          Días de anticipación para alertas en el dashboard.
        </p>
        <form ref={daysFormRef} action={daysAction} className="flex items-end gap-3">
          <div className="w-32">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              Días
            </label>
            <input
              name="alert_days"
              type="number"
              min={1}
              max={90}
              defaultValue={alertDays}
              className="w-full rounded-xl border border-white/[0.07] bg-ink-950/60 px-4 py-3 font-mono text-sm text-zinc-100 outline-none transition focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={daysPending}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40"
          >
            {daysPending ? "…" : "Guardar"}
          </button>
          <span className="pb-3 text-[11px] text-zinc-700">⌘S</span>
        </form>

        {daysState && !daysState.ok && (
          <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-2.5 text-sm text-red-300">
            {daysState.message}
          </p>
        )}
      </div>

      {/* System status */}
      {systemStatus && (
        <div className="rounded-xl border border-white/[0.06] bg-ink-900/40 p-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600 mb-4">
            Estado del sistema
          </p>
          <div className="space-y-3">
            {[
              {
                label: "SQLite (bookido-v2)",
                ok: systemStatus.sqlite?.ok ?? false,
                detail: systemStatus.sqlite
                  ? `${systemStatus.sqlite.businesses} negocios · ${systemStatus.sqlite.reservas} reservas · ${systemStatus.sqlite.leads} leads`
                  : "Sin conexión",
              },
              {
                label: "Supabase (auth + admin DB)",
                ok: systemStatus.supabase,
                detail: systemStatus.supabase ? "Conectado" : "Sin conexión",
              },
              {
                label: "WhatsApp Gateway",
                ok: systemStatus.wa?.connected ?? false,
                detail: systemStatus.wa?.connected
                  ? `Conectado · ${systemStatus.wa.user}`
                  : "Desconectado",
              },
              {
                label: "Resend (email API)",
                ok: systemStatus.resend,
                detail: systemStatus.resend ? "API key válida" : "No disponible",
              },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <StatusDot ok={row.ok} />
                <div className="flex-1">
                  <p className="text-sm text-zinc-300">{row.label}</p>
                  <p className="text-xs text-zinc-600">{row.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-zinc-700 font-mono">
            Actualizado: {new Date(systemStatus.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}
    </div>
  );
}
