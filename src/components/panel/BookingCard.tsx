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

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Confirmada
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Pendiente
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
      Cancelada
    </span>
  );
}

export function BookingCard({ b }: { b: Booking }) {
  const [pending, startTransition] = useTransition();
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const start = new Date(b.starts_at);
  const confirmed = b.status === "confirmed";
  const cancelled = b.status === "cancelled";

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
    <div className={`rounded-xl border bg-ink-900/40 p-4 transition ${cancelled ? "border-white/[0.04] opacity-50" : "border-white/[0.07]"}`}>
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-zinc-100">{b.customer_name}</p>
        <StatusBadge status={b.status} />
      </div>

      {/* Service + date/time */}
      <div className="mt-2 flex items-center gap-3">
        <div className="flex-shrink-0 rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-center">
          <p className="font-mono text-sm font-semibold text-white">{format(start, "HH:mm")}</p>
          <p className="text-[10px] text-zinc-500">{format(start, "d MMM", { locale: es }).replace(/^\w/, c => c.toUpperCase())}</p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-zinc-300">{b.service_name}</p>
          {b.notes && (
            <p className="mt-0.5 truncate text-xs italic text-zinc-600">&ldquo;{b.notes}&rdquo;</p>
          )}
        </div>
      </div>

      {/* Bottom row: actions */}
      <div className="mt-3 flex items-center gap-2 border-t border-white/[0.05] pt-3">
        {b.customer_phone && (
          <a
            href={`https://wa.me/${b.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${b.customer_name}, te recordamos tu turno a las ${format(start, "HH:mm")}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/15"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        )}
        <div className="ml-auto flex items-center gap-1">
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
            {emailState === "sending" ? "…" : emailState === "sent" ? "✓ Email" : emailState === "error" ? "Error" : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
              confirmed
                ? "text-red-400 hover:bg-red-500/10"
                : "text-emerald-400 hover:bg-emerald-500/10"
            }`}
          >
            {pending ? "…" : confirmed ? "Cancelar" : "Restaurar"}
          </button>
        </div>
      </div>
    </div>
  );
}
