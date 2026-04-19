"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toggleGoogleSyncAction } from "@/app/panel/configuracion/google-actions";

type GoogleCalendarConnection = {
  google_user_email: string;
  sync_enabled: boolean;
  last_sync_at: string | null;
} | null;

interface Props {
  connection: GoogleCalendarConnection;
  authUrl: string; // /api/google/auth — redirect to Google OAuth
}

export function GoogleCalendarCard({ connection, authUrl }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [syncEnabled, setSyncEnabled] = useState(connection?.sync_enabled ?? true);
  const [togglePending, startToggle] = useTransition();
  const [disconnecting, setDisconnecting] = useState(false);

  // Handle ?gcal= query param feedback after OAuth redirect
  const gcalParam = searchParams.get("gcal");

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/google/disconnect", { method: "POST" });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setDisconnecting(false);
    }
  }

  function handleToggle(enabled: boolean) {
    setSyncEnabled(enabled);
    startToggle(async () => {
      await toggleGoogleSyncAction(enabled);
    });
  }

  return (
    <div className="mt-6 rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05]">
          {/* Google Calendar icon */}
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400"/>
            <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400"/>
            <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-zinc-400"/>
            <path d="M8 13h2v2H8z" fill="currentColor" className="text-indigo-400"/>
            <path d="M11 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-zinc-500"/>
            <path d="M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-zinc-500"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-200">Google Calendar</p>
          <p className="text-xs text-zinc-500">Sincroniza citas automáticamente</p>
        </div>
      </div>

      {/* OAuth feedback banners */}
      {gcalParam === "connected" && (
        <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
          ✓ Google Calendar conectado correctamente.
        </div>
      )}
      {gcalParam === "error" && (
        <div className="mb-4 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          Error al conectar. Intenta de nuevo.
        </div>
      )}

      {/* Token-expired warning */}
      {connection && !connection.sync_enabled && gcalParam !== "connected" && (
        <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          ⚠ El token expiró. Reconecta tu cuenta para reactivar la sincronización.
        </div>
      )}

      {/* ── NOT CONNECTED ── */}
      {!connection && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Conecta tu Google Calendar para que las citas de Bookido aparezcan
            automáticamente y los eventos personales bloqueen tu agenda.
          </p>
          <a
            href={authUrl}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Conectar Google Calendar
          </a>
        </div>
      )}

      {/* ── CONNECTED ── */}
      {connection && (
        <div className="flex flex-col gap-4">
          {/* Status row */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-sm text-zinc-300">
              Conectado como{" "}
              <span className="font-mono text-xs text-zinc-200">
                {connection.google_user_email}
              </span>
            </span>
          </div>

          {/* Sync toggle */}
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-sm text-zinc-400">Sincronización activa</span>
            <button
              type="button"
              role="switch"
              aria-checked={syncEnabled}
              disabled={togglePending}
              onClick={() => handleToggle(!syncEnabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${
                syncEnabled ? "bg-indigo-600" : "bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  syncEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </label>

          {/* Last sync */}
          {connection.last_sync_at && (
            <p className="text-xs text-zinc-600">
              Última sync:{" "}
              {new Date(connection.last_sync_at).toLocaleString("es-DO", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}

          {/* Disconnect */}
          <button
            type="button"
            disabled={disconnecting}
            onClick={handleDisconnect}
            className="self-start rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {disconnecting ? "Desconectando…" : "Desconectar"}
          </button>
        </div>
      )}
    </div>
  );
}
