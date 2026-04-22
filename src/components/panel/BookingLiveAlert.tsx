"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  return (
    d.toLocaleDateString("es-DO", {
      weekday: "long", day: "numeric", month: "long",
      timeZone: "America/Santo_Domingo",
    }) + " a las " +
    d.toLocaleTimeString("es-DO", {
      hour: "2-digit", minute: "2-digit", hour12: false,
      timeZone: "America/Santo_Domingo",
    })
  );
}

// Neon orange confetti particles
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  color: [
    "#FF6B00", "#FF8C00", "#FFA500", "#FFD700",
    "#FF4500", "#FF6347", "#FFAA00", "#FF7F00",
  ][i % 8],
  left: `${(i * 37 + 5) % 100}%`,
  delay: `${(i * 0.13) % 1.2}s`,
  duration: `${0.9 + (i * 0.07) % 0.8}s`,
  size: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
  shape: i % 4 === 0 ? "circle" : i % 4 === 1 ? "rect" : i % 4 === 2 ? "diamond" : "star",
}));

export function BookingLiveAlert({ tenantSlug }: Props) {
  const [modal, setModal] = useState<(LiveBooking & { key: number }) | null>(null);
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeout(() => setModal(null), 350);
  }, []);

  const showModal = useCallback((booking: LiveBooking) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setProgress(100);
    setModal({ ...booking, key: Date.now() });
    setVisible(false);
    // Tiny delay so the enter animation fires
    setTimeout(() => setVisible(true), 20);

    // Countdown progress bar (12s)
    const total = 12000;
    const step = 80;
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += step;
      setProgress(Math.max(0, 100 - (elapsed / total) * 100));
      if (elapsed >= total) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, step);

    timerRef.current = setTimeout(dismiss, total);

    // Celebratory sound — triple tone
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      [[523, 0], [659, 0.12], [784, 0.24]].forEach(([freq, when]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + when);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + when + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.5);
        osc.start(ctx.currentTime + when);
        osc.stop(ctx.currentTime + when + 0.5);
      });
    } catch { /* no audio */ }
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

          const booking: LiveBooking = {
            id: row.id,
            customer_name: row.customer_name,
            customer_phone: row.customer_phone,
            service_name: serviceName,
            starts_at: row.starts_at,
            notes: row.notes,
          };
          showModal(booking);
          window.dispatchEvent(new CustomEvent("bookido:newbooking", { detail: booking }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tenantSlug, showModal]);

  if (!modal) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
        aria-live="assertive"
      >
        <div
          className="relative pointer-events-auto w-full max-w-md overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(145deg, #0f0a00 0%, #1a0f00 50%, #0d0800 100%)",
            border: "1.5px solid rgba(255,107,0,0.5)",
            boxShadow: visible
              ? "0 0 0 1px rgba(255,107,0,0.2), 0 0 40px rgba(255,107,0,0.35), 0 0 80px rgba(255,107,0,0.15), 0 32px 80px rgba(0,0,0,0.8)"
              : "none",
            transform: visible
              ? "scale(1) translateY(0)"
              : "scale(0.75) translateY(40px)",
            opacity: visible ? 1 : 0,
            transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease, box-shadow 0.4s ease",
          }}
        >
          {/* Confetti burst */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none" aria-hidden>
            {PARTICLES.map((p) => (
              <span
                key={p.id}
                style={{
                  position: "absolute",
                  top: "-12px",
                  left: p.left,
                  width: p.size,
                  height: p.shape === "rect" ? p.size * 1.6 : p.size,
                  background: p.color,
                  borderRadius: p.shape === "circle" ? "50%" : p.shape === "diamond" ? "2px" : "1px",
                  transform: p.shape === "diamond" ? "rotate(45deg)" : "none",
                  opacity: visible ? 0 : 1,
                  animation: visible ? `confettiFall ${p.duration} ${p.delay} ease-in forwards` : "none",
                  boxShadow: `0 0 6px ${p.color}`,
                }}
              />
            ))}
          </div>

          {/* Neon glow ring behind the icon */}
          <div
            aria-hidden
            className="absolute -top-16 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(255,107,0,0.25) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />

          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-orange-300/50 transition hover:bg-white/[0.08] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="relative flex flex-col items-center pt-8 pb-5 px-6 text-center">
            {/* Big animated icon */}
            <div
              className="mb-3 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
              style={{
                background: "linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,160,0,0.1))",
                border: "2px solid rgba(255,107,0,0.4)",
                boxShadow: "0 0 24px rgba(255,107,0,0.3), inset 0 0 20px rgba(255,107,0,0.05)",
                animation: visible ? "iconBounce 0.6s 0.3s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
              }}
            >
              🎉
            </div>

            <p
              className="font-future text-xs font-bold uppercase tracking-[0.3em] mb-1"
              style={{ color: "rgba(255,160,0,0.7)" }}
            >
              acaba de llegar
            </p>
            <h2
              className="font-future text-3xl font-black tracking-tight leading-none"
              style={{
                background: "linear-gradient(90deg, #FF6B00, #FFD700, #FF8C00)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "none",
                filter: "drop-shadow(0 0 12px rgba(255,107,0,0.6))",
                animation: visible ? "textGlow 1.5s 0.4s ease-in-out infinite alternate" : "none",
              }}
            >
              ¡NUEVA RESERVA!
            </h2>
          </div>

          {/* Divider */}
          <div
            className="mx-6 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,107,0,0.4), transparent)" }}
          />

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Customer */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,160,0,0.1))",
                    border: "1px solid rgba(255,107,0,0.3)",
                    color: "#FF8C00",
                  }}
                >
                  {modal.customer_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-white truncate">{modal.customer_name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,160,0,0.6)" }}>cliente nuevo</p>
                </div>
              </div>
              {modal.customer_phone && (
                <a
                  href={`https://wa.me/${modal.customer_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition"
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    color: "#4ade80",
                  }}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Escribir
                </a>
              )}
            </div>

            {/* Service + time */}
            <div
              className="rounded-2xl p-4 space-y-2.5"
              style={{
                background: "rgba(255,107,0,0.06)",
                border: "1px solid rgba(255,107,0,0.15)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">✂️</span>
                <div>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,160,0,0.5)" }}>Servicio</p>
                  <p className="text-sm font-semibold text-white">{modal.service_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-lg">📅</span>
                <div>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,160,0,0.5)" }}>Fecha y hora</p>
                  <p className="text-sm font-semibold text-white capitalize">{formatDateTime(modal.starts_at)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {modal.notes && (
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Nota del cliente</p>
                <p className="text-sm italic text-zinc-300">"{modal.notes}"</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <button
              onClick={dismiss}
              className="w-full rounded-2xl py-3.5 text-sm font-bold uppercase tracking-widest transition"
              style={{
                background: "linear-gradient(135deg, #FF6B00, #FF8C00)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(255,107,0,0.4), 0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              ¡Genial, a trabajar! 🔥
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 overflow-hidden" style={{ background: "rgba(255,107,0,0.1)" }}>
            <div
              className="h-full origin-left"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #FF6B00, #FFD700)",
                boxShadow: "0 0 8px rgba(255,107,0,0.6)",
                transition: "width 80ms linear",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: translateY(420px) rotate(520deg) scale(0.5); opacity: 0; }
        }
        @keyframes iconBounce {
          0%   { transform: scale(0) rotate(-15deg); }
          60%  { transform: scale(1.2) rotate(8deg); }
          80%  { transform: scale(0.92) rotate(-4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes textGlow {
          from { filter: drop-shadow(0 0 8px rgba(255,107,0,0.5)); }
          to   { filter: drop-shadow(0 0 20px rgba(255,200,0,0.8)); }
        }
      `}</style>
    </>
  );
}
