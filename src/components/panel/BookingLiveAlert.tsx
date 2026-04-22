"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type LiveBooking = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  service_name: string;
  starts_at: string;
  notes: string | null;
};

type Props = { tenantSlug: string };

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-DO", {
    weekday: "short", day: "numeric", month: "short",
    timeZone: "America/Santo_Domingo",
  }) + " · " + d.toLocaleTimeString("es-DO", {
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "America/Santo_Domingo",
  });
}

export function BookingLiveAlert({ tenantSlug }: Props) {
  const [toasts, setToasts] = useState<(LiveBooking & { key: number })[]>([]);
  const [counter, setCounter] = useState(0);

  const dismiss = useCallback((key: number) => {
    setToasts((prev) => prev.filter((t) => t.key !== key));
  }, []);

  const addToast = useCallback((booking: LiveBooking) => {
    const key = Date.now();
    setToasts((prev) => [...prev.slice(-2), { ...booking, key }]); // max 3 stacked
    setCounter((c) => c + 1);
    // Auto-dismiss after 9s
    setTimeout(() => dismiss(key), 9000);
    // Play subtle sound
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* no audio context */ }
  }, [dismiss]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`bookings:${tenantSlug}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookido_bookings",
          filter: `tenant_slug=eq.${tenantSlug}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string; customer_name: string; customer_phone: string | null;
            service_id: string; starts_at: string; notes: string | null;
          };

          let serviceName = "Reserva";
          try {
            const { data } = await supabase
              .from("bookido_services")
              .select("name")
              .eq("id", row.service_id)
              .maybeSingle();
            if (data?.name) serviceName = data.name;
          } catch { /* ignore */ }

          const booking = {
            id: row.id,
            customer_name: row.customer_name,
            customer_phone: row.customer_phone,
            service_name: serviceName,
            starts_at: row.starts_at,
            notes: row.notes,
          };
          addToast(booking);
          // Feed the bell counter without a second DB query
          window.dispatchEvent(new CustomEvent("bookido:newbooking", { detail: booking }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantSlug, addToast]);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-5 z-[100] flex flex-col gap-3 items-end" aria-live="polite">
      {toasts.map((t, i) => (
        <div
          key={t.key}
          style={{
            transform: `translateY(${(toasts.length - 1 - i) * -6}px) scale(${1 - (toasts.length - 1 - i) * 0.02})`,
            zIndex: 100 + i,
            opacity: i === toasts.length - 1 ? 1 : 0.7,
          }}
          className="w-80 rounded-2xl border border-emerald-500/30 bg-zinc-950/95 shadow-[0_8px_40px_0_rgba(16,185,129,0.18)] backdrop-blur-md transition-all duration-300 animate-in slide-in-from-right-8 fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 px-4 py-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-base">📅</span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Nueva reserva</p>
                {counter > 1 && <p className="text-[10px] text-zinc-500">{counter} en esta sesión</p>}
              </div>
            </div>
            <button
              onClick={() => dismiss(t.key)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.08] transition text-xs"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{t.customer_name}</p>
              {t.customer_phone && (
                <a
                  href={`https://wa.me/${t.customer_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400 hover:bg-emerald-500/20 transition"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WA
                </a>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[12px] text-zinc-400">
              <span className="text-zinc-600">💅</span>
              <span>{t.service_name}</span>
              <span className="text-zinc-700">·</span>
              <span>{formatDateTime(t.starts_at)}</span>
            </div>

            {t.notes && (
              <div className="mt-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                <p className="text-[11px] text-zinc-600 uppercase tracking-wider mb-0.5">Nota del cliente</p>
                <p className="text-[12px] italic text-zinc-300">"{t.notes}"</p>
              </div>
            )}
          </div>

          {/* Progress bar auto-dismiss */}
          <div className="h-0.5 overflow-hidden rounded-b-2xl bg-white/[0.04]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 origin-left"
              style={{ animation: "shrink 9s linear forwards" }}
            />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        .animate-in { animation: slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(32px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
