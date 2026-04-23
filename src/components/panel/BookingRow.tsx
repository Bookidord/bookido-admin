"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  cancelBookingAction,
  restoreBookingAction,
  completeBookingAction,
  noShowBookingAction,
  resendBookingEmailAction,
} from "@/app/panel/reservas/actions";

type Booking = {
  id: string;
  starts_at: string;
  ends_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  notes: string | null;
  status: string;
  service_name: string;
};

const STATUS_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  confirmed: { label: "Confirmada",  cls: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400", dot: "bg-emerald-400" },
  completed: { label: "Completada",  cls: "border-blue-400/20 bg-blue-400/10 text-blue-400",          dot: "bg-blue-400" },
  cancelled: { label: "Cancelada",   cls: "border-zinc-600/30 bg-zinc-600/10 text-zinc-500",           dot: "bg-zinc-500" },
  no_show:   { label: "No se presentó", cls: "border-amber-400/20 bg-amber-400/10 text-amber-400",    dot: "bg-amber-400" },
};

export function BookingRow({ b }: { b: Booking }) {
  const [pending, startTransition] = useTransition();
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [open, setOpen] = useState(false);

  const start = new Date(b.starts_at.replace(" ", "T"));
  const end   = new Date(b.ends_at.replace(" ", "T"));
  const isConfirmed = b.status === "confirmed";

  const badge = STATUS_BADGE[b.status] ?? STATUS_BADGE.confirmed;

  function act(action: (id: string) => Promise<{ ok: boolean }>) {
    setOpen(false);
    startTransition(() => { action(b.id); });
  }

  async function resendEmail() {
    setEmailState("sending");
    const res = await resendBookingEmailAction(b.id);
    setEmailState(res.ok ? "sent" : "error");
    setTimeout(() => setEmailState("idle"), 3000);
  }

  return (
    <tr className={`border-b border-white/[0.05] transition hover:bg-white/[0.02] ${b.status !== "confirmed" ? "opacity-60" : ""}`}>
      {/* Date / time */}
      <td className="px-4 py-3.5 text-sm">
        <p className="font-mono font-medium text-white">{format(start, "HH:mm")}</p>
        <p className="text-xs text-zinc-600">{format(start, "d MMM", { locale: es })}</p>
      </td>

      {/* Client */}
      <td className="px-4 py-3.5">
        <p className="text-sm font-medium text-zinc-100">{b.customer_name}</p>
        <p className="text-xs text-zinc-600">{b.customer_email}</p>
      </td>

      {/* Service */}
      <td className="hidden px-4 py-3.5 text-sm text-zinc-400 sm:table-cell">
        {b.service_name}
        <span className="ml-1.5 text-xs text-zinc-600">
          ({Math.round((end.getTime() - start.getTime()) / 60000)} min)
        </span>
      </td>

      {/* Phone */}
      <td className="hidden px-4 py-3.5 lg:table-cell">
        {b.customer_phone ? (
          <a href={`https://wa.me/${b.customer_phone.replace(/\D/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-emerald-400 underline underline-offset-2 hover:text-emerald-300 transition">
            {b.customer_phone}
          </a>
        ) : (
          <span className="text-xs text-zinc-700">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1">
          {/* Email resend */}
          <button type="button" onClick={resendEmail} disabled={emailState === "sending"}
            title="Reenviar email"
            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
              emailState === "sent" ? "text-emerald-400" : emailState === "error" ? "text-red-400" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
            }`}>
            {emailState === "sending" ? "…" : emailState === "sent" ? "✓" : emailState === "error" ? "!" : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* Action menu */}
          <div className="relative">
            <button type="button" onClick={() => setOpen(o => !o)} disabled={pending}
              className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300 disabled:opacity-40">
              {pending ? "…" : "···"}
            </button>
            {open && (
              <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-xl border border-white/[0.08] bg-zinc-900 py-1 shadow-2xl">
                {isConfirmed && (
                  <>
                    <button onClick={() => act(completeBookingAction)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-blue-400 transition hover:bg-blue-400/10">
                      ✓ Completada
                    </button>
                    <button onClick={() => act(noShowBookingAction)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-amber-400 transition hover:bg-amber-400/10">
                      👻 No se presentó
                    </button>
                    <button onClick={() => act(cancelBookingAction)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-red-400 transition hover:bg-red-400/10">
                      ✕ Cancelar
                    </button>
                  </>
                )}
                {!isConfirmed && (
                  <button onClick={() => act(restoreBookingAction)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-emerald-400 transition hover:bg-emerald-400/10">
                    ↩ Restaurar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
