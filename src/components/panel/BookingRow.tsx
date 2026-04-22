"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cancelBookingAction, restoreBookingAction, resendBookingEmailAction } from "@/app/panel/reservas/actions";

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

export function BookingRow({ b }: { b: Booking }) {
  const [pending, startTransition] = useTransition();
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const start = new Date(b.starts_at);
  const end = new Date(b.ends_at);
  const confirmed = b.status === "confirmed";

  function toggle() {
    startTransition(async () => {
      if (confirmed) await cancelBookingAction(b.id);
      else await restoreBookingAction(b.id);
    });
  }

  async function resendEmail() {
    setEmailState("sending");
    const res = await resendBookingEmailAction(b.id);
    setEmailState(res.ok ? "sent" : "error");
    setTimeout(() => setEmailState("idle"), 3000);
  }

  return (
    <tr className={`border-b border-white/[0.05] transition hover:bg-white/[0.02] ${!confirmed ? "opacity-50" : ""}`}>
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
          <a
            href={`https://wa.me/${b.customer_phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 underline underline-offset-2 hover:text-emerald-300 transition"
          >
            {b.customer_phone}
          </a>
        ) : (
          <span className="text-xs text-zinc-700">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        {confirmed ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Confirmada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2 py-0.5 text-xs font-medium text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
            Cancelada
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={resendEmail}
            disabled={emailState === "sending"}
            title="Reenviar email de confirmación"
            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
              emailState === "sent"
                ? "text-emerald-400"
                : emailState === "error"
                ? "text-red-400"
                : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
            }`}
          >
            {emailState === "sending" ? "…" : emailState === "sent" ? "✓" : emailState === "error" ? "!" : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
              confirmed
                ? "text-red-400 hover:bg-red-500/10"
                : "text-emerald-400 hover:bg-emerald-500/10"
            }`}
          >
            {pending ? "…" : confirmed ? "Cancelar" : "Restaurar"}
          </button>
        </div>
      </td>
    </tr>
  );
}
