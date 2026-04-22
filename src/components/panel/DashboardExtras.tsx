"use client";

import { useState, useEffect, useCallback } from "react";
import type { BadgeState } from "@/lib/dashboard-utils";

type TurnoDestacado = { customerName: string; serviceName: string; price: number } | null;
type NextBadge = { emoji: string; label: string; current: number; target: number } | null;

type Props = {
  nextBookingISO: string | null;
  nextBookingName: string;
  nextServiceName: string;
  racha: number;
  mejorSemana: number;
  totalBookings: number;
  turnoDestacado: TurnoDestacado;
  phraseOfDay: string;
  tipOfDay: string;
  unlockedBadges: BadgeState[];
  nextBadge: NextBadge;
};

function computeCountdown(iso: string | null): { label: string; urgent: boolean } {
  if (!iso) return { label: "", urgent: false };
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (diff < 0) return { label: "En curso ahora", urgent: true };
  if (diff === 0) return { label: "¡Ahora mismo!", urgent: true };
  if (diff < 10) return { label: `En ${diff} min`, urgent: true };
  if (diff < 60) return { label: `En ${diff} min`, urgent: false };
  const h = Math.floor(diff / 60), m = diff % 60;
  return { label: `En ${h}h${m > 0 ? ` ${m}min` : ""}`, urgent: false };
}

export function DashboardExtras({
  nextBookingISO,
  nextBookingName,
  nextServiceName,
  racha,
  mejorSemana,
  totalBookings,
  turnoDestacado,
  phraseOfDay,
  tipOfDay,
  unlockedBadges,
  nextBadge,
}: Props) {
  const [countdown, setCountdown] = useState(() => computeCountdown(nextBookingISO));

  const refresh = useCallback(() => {
    setCountdown(computeCountdown(nextBookingISO));
  }, [nextBookingISO]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const lastThree = unlockedBadges.slice(-3);
  const progressPct = nextBadge
    ? Math.min(100, Math.round((nextBadge.current / nextBadge.target) * 100))
    : 0;

  return (
    <div className="space-y-4 mt-6">

      {/* ── Row 1: Próximo turno + Racha / Récord ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Próximo turno */}
        <div className="rounded-xl border border-cyan-400/15 bg-gradient-to-br from-cyan-950/40 to-ink-900/60 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70 mb-2">
            ⏰ Próximo turno
          </p>
          {nextBookingISO ? (
            <>
              <p
                className={`font-future text-2xl font-bold transition-colors ${
                  countdown.urgent ? "text-amber-300" : "text-cyan-300"
                }`}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {countdown.label}
              </p>
              <p className="mt-1 text-sm text-zinc-300 truncate">
                {nextBookingName}
              </p>
              <p className="text-xs text-zinc-500 truncate">{nextServiceName}</p>
            </>
          ) : (
            <p className="font-future text-xl text-zinc-600">Sin turnos hoy</p>
          )}
        </div>

        {/* Racha + Récord */}
        <div className="grid grid-rows-2 gap-3">
          {/* Racha */}
          <div className="rounded-xl border border-orange-400/15 bg-gradient-to-br from-orange-950/40 to-ink-900/60 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div className="min-w-0">
              <p className="font-future text-2xl font-bold text-orange-300 tabular-nums">
                {racha}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {racha === 1 ? "día seguido" : "días seguidos"} con reservas
              </p>
            </div>
          </div>

          {/* Récord */}
          <div className="rounded-xl border border-yellow-400/15 bg-gradient-to-br from-yellow-950/40 to-ink-900/60 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div className="min-w-0">
              <p className="font-future text-2xl font-bold text-yellow-300 tabular-nums">
                {mejorSemana}
              </p>
              <p className="text-xs text-zinc-500 truncate">mejor semana histórica</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Logros / Badges ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          🏅 Logros
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {lastThree.length === 0 ? (
            <p className="text-xs text-zinc-600">Haz tu primera reserva para desbloquear logros.</p>
          ) : (
            lastThree.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 rounded-full border border-[#14F195]/20 bg-[#14F195]/[0.06] px-3 py-1.5"
              >
                <span>{b.emoji}</span>
                <span className="text-xs font-medium text-zinc-200">{b.label}</span>
              </div>
            ))
          )}
          {unlockedBadges.length > 3 && (
            <div className="flex items-center rounded-full border border-white/[0.08] px-3 py-1.5">
              <span className="text-xs text-zinc-500">+{unlockedBadges.length - 3} más</span>
            </div>
          )}
        </div>

        {nextBadge && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Próximo: {nextBadge.emoji} <span className="text-zinc-300">{nextBadge.label}</span>
              </p>
              <p className="text-xs tabular-nums text-zinc-600">
                {nextBadge.current}/{nextBadge.target}
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#14F195] to-cyan-400 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Row 2: Turno destacado + Tip ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Turno destacado */}
        <div className="rounded-xl border border-pink-400/15 bg-gradient-to-br from-pink-950/40 to-ink-900/60 p-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-pink-400/70">
            ⭐ Turno destacado hoy
          </p>
          {turnoDestacado ? (
            <>
              <p className="font-future text-lg font-semibold text-pink-200 truncate">
                {turnoDestacado.serviceName}
              </p>
              <p className="text-sm text-zinc-400 truncate">{turnoDestacado.customerName}</p>
              <p className="mt-2 font-future text-xl font-bold text-pink-300">
                RD${turnoDestacado.price.toLocaleString()}
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-600">Sin reservas confirmadas hoy</p>
          )}
        </div>

        {/* Tip del día */}
        <div className="rounded-xl border border-emerald-400/15 bg-gradient-to-br from-emerald-950/40 to-ink-900/60 p-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70">
            Tip del día
          </p>
          <p className="text-sm leading-relaxed text-zinc-300">{tipOfDay}</p>
        </div>

      </div>

    </div>
  );
}
