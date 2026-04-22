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
  const date = d.toLocaleDateString("es-DO", {
    weekday: "long", day: "numeric", month: "long",
    timeZone: "America/Santo_Domingo",
  });
  const time = d.toLocaleTimeString("es-DO", {
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "America/Santo_Domingo",
  });
  return { date, time, full: `${date} a las ${time}` };
}

function buildWaMessage(name: string, service: string, iso: string) {
  const { date, time } = formatDateTime(iso);
  return encodeURIComponent(
    `¡Hola ${name}! 👋\n\n` +
    `✅ Tu reserva está *confirmada*:\n` +
    `• Servicio: *${service}*\n` +
    `• Fecha: *${date.charAt(0).toUpperCase() + date.slice(1)}*\n` +
    `• Hora: *${time}*\n\n` +
    `¡Te esperamos! Si necesitas hacer algún cambio, escríbenos aquí. 🙌`
  );
}

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  color: ["#FF6B00","#FF8C00","#FFA500","#FFD700","#FF4500","#FF6347","#FFAA00","#FF7F00"][i % 8],
  left: `${(i * 37 + 3) % 98}%`,
  delay: `${(i * 0.11) % 1.1}s`,
  duration: `${0.85 + (i * 0.065) % 0.75}s`,
  size: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
  shape: i % 4,
}));

export function BookingLiveAlert({ tenantSlug }: Props) {
  const [queue, setQueue] = useState<(LiveBooking & { key: number })[]>([]);
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load mute pref
  useEffect(() => {
    try { setMuted(localStorage.getItem("bookido:sound") === "off"); } catch { /* */ }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      try { localStorage.setItem("bookido:sound", m ? "on" : "off"); } catch { /* */ }
      return !m;
    });
  }, []);

  const advance = useCallback(() => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeout(() => setQueue((prev) => prev.slice(1)), 350);
  }, []);

  // When queue head changes, animate in
  useEffect(() => {
    if (!queue.length) { setVisible(false); return; }

    setProgress(100);
    setVisible(false);
    const show = setTimeout(() => setVisible(true), 20);

    const total = 13000;
    const step = 80;
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += step;
      setProgress(Math.max(0, 100 - (elapsed / total) * 100));
      if (elapsed >= total && intervalRef.current) clearInterval(intervalRef.current);
    }, step);
    timerRef.current = setTimeout(advance, total);

    return () => {
      clearTimeout(show);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue[0]?.key]);

  const playSound = useCallback(() => {
    if (muted) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.38]].forEach(([freq, when]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + when);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + when + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.5);
        osc.start(ctx.currentTime + when);
        osc.stop(ctx.currentTime + when + 0.6);
      });
    } catch { /* no audio */ }
  }, [muted]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`bookings:${tenantSlug}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "bookido_bookings",
        filter: `tenant_slug=eq.${tenantSlug}`,
      }, async (payload) => {
        const row = payload.new as {
          id: string; customer_name: string; customer_phone: string | null;
          service_id: string; starts_at: string; notes: string | null;
        };
        let serviceName = "Reserva";
        try {
          const { data } = await supabase.from("bookido_services").select("name").eq("id", row.service_id).maybeSingle();
          if (data?.name) serviceName = data.name;
        } catch { /* */ }

        const booking: LiveBooking = {
          id: row.id, customer_name: row.customer_name,
          customer_phone: row.customer_phone, service_name: serviceName,
          starts_at: row.starts_at, notes: row.notes,
        };

        setQueue((prev) => [...prev, { ...booking, key: Date.now() }]);
        playSound();
        window.dispatchEvent(new CustomEvent("bookido:newbooking", { detail: booking }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantSlug, playSound]);

  const copyPhone = useCallback(async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  }, []);

  const current = queue[0];
  const waiting = queue.length - 1;

  if (!current) return null;

  const { full: dateLabel } = formatDateTime(current.starts_at);
  const waHref = current.customer_phone
    ? `https://wa.me/${current.customer_phone.replace(/\D/g, "")}?text=${buildWaMessage(current.customer_name, current.service_name, current.starts_at)}`
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={advance}
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none" aria-live="assertive">
        <div
          className="relative pointer-events-auto w-full max-w-md overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(145deg,#0f0a00,#1a0f00 50%,#0d0800)",
            border: "1.5px solid rgba(255,107,0,0.5)",
            boxShadow: visible ? "0 0 0 1px rgba(255,107,0,0.2),0 0 40px rgba(255,107,0,0.35),0 0 80px rgba(255,107,0,0.15),0 32px 80px rgba(0,0,0,0.8)" : "none",
            transform: visible ? "scale(1) translateY(0)" : "scale(0.75) translateY(40px)",
            opacity: visible ? 1 : 0,
            transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1),opacity 0.3s ease,box-shadow 0.4s ease",
          }}
        >
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none" aria-hidden>
            {PARTICLES.map((p) => (
              <span key={p.id} style={{
                position: "absolute", top: "-12px", left: p.left,
                width: p.size, height: p.shape === 1 ? p.size * 1.6 : p.size,
                background: p.color,
                borderRadius: p.shape === 0 ? "50%" : p.shape === 2 ? "2px" : "1px",
                transform: p.shape === 2 ? "rotate(45deg)" : "none",
                opacity: visible ? 0 : 1,
                animation: visible ? `confettiFall ${p.duration} ${p.delay} ease-in forwards` : "none",
                boxShadow: `0 0 6px ${p.color}`,
              }} />
            ))}
          </div>

          {/* Ambient glow */}
          <div aria-hidden className="absolute -top-16 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(255,107,0,0.25) 0%,transparent 70%)", filter: "blur(20px)" }} />

          {/* Top-right controls: mute + close */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
            <button onClick={toggleMute} title={muted ? "Activar sonido" : "Silenciar"}
              className="flex h-8 w-8 items-center justify-center rounded-full text-orange-300/40 transition hover:bg-white/[0.08] hover:text-orange-300">
              {muted
                ? <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
                : <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0-12L7.757 8.243A1 1 0 017 9H5a1 1 0 00-1 1v4a1 1 0 001 1h2a1 1 0 01.757.343L12 18"/></svg>
              }
            </button>
            <button onClick={advance}
              className="flex h-8 w-8 items-center justify-center rounded-full text-orange-300/40 transition hover:bg-white/[0.08] hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Queue badge */}
          {waiting > 0 && (
            <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: "rgba(255,107,0,0.2)", border: "1px solid rgba(255,107,0,0.4)", color: "#FFB347" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "#FF6B00" }}/>
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#FF6B00" }}/>
              </span>
              {waiting} más esperando
            </div>
          )}

          {/* Header */}
          <div className="relative flex flex-col items-center pt-8 pb-5 px-6 text-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
              style={{
                background: "linear-gradient(135deg,rgba(255,107,0,0.2),rgba(255,160,0,0.1))",
                border: "2px solid rgba(255,107,0,0.4)",
                boxShadow: "0 0 24px rgba(255,107,0,0.3),inset 0 0 20px rgba(255,107,0,0.05)",
                animation: visible ? "iconBounce 0.6s 0.3s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
              }}>
              🎉
            </div>
            <p className="font-future text-xs font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "rgba(255,160,0,0.7)" }}>
              acaba de llegar
            </p>
            <h2 className="font-future text-3xl font-black tracking-tight leading-none"
              style={{
                background: "linear-gradient(90deg,#FF6B00,#FFD700,#FF8C00)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                filter: "drop-shadow(0 0 12px rgba(255,107,0,0.6))",
                animation: visible ? "textGlow 1.5s 0.4s ease-in-out infinite alternate" : "none",
              }}>
              ¡NUEVA RESERVA!
            </h2>
          </div>

          <div className="mx-6 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,107,0,0.4),transparent)" }} />

          {/* Body */}
          <div className="px-6 py-5 space-y-4">

            {/* Customer row */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-base font-bold"
                style={{
                  background: "linear-gradient(135deg,rgba(255,107,0,0.2),rgba(255,160,0,0.1))",
                  border: "1px solid rgba(255,107,0,0.3)", color: "#FF8C00",
                }}>
                {current.customer_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-white truncate">{current.customer_name}</p>
                {current.customer_phone && (
                  <button onClick={() => copyPhone(current.customer_phone!)}
                    className="flex items-center gap-1.5 mt-0.5 text-xs transition"
                    style={{ color: copied ? "#4ade80" : "rgba(255,160,0,0.55)" }}>
                    {copied
                      ? <><svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Copiado</>
                      : <><svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>{current.customer_phone}</>
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Service + date card */}
            <div className="rounded-2xl p-4 space-y-3"
              style={{ background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.15)" }}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✂️</span>
                <div>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,160,0,0.5)" }}>Servicio</p>
                  <p className="text-sm font-semibold text-white">{current.service_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,160,0,0.5)" }}>Fecha y hora</p>
                  <p className="text-sm font-semibold text-white capitalize">{dateLabel}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {current.notes && (
              <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Nota del cliente</p>
                <p className="text-sm italic text-zinc-300">"{current.notes}"</p>
              </div>
            )}

            {/* Actions row */}
            <div className="flex gap-2.5 pt-1">
              {/* WhatsApp CTA — pre-filled message */}
              {waHref ? (
                <a href={waHref} target="_blank" rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition"
                  style={{
                    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                    color: "#4ade80",
                  }}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Confirmar por WA
                </a>
              ) : (
                <div className="flex-1" />
              )}

              {/* Dismiss */}
              <button onClick={advance}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold uppercase tracking-widest transition"
                style={{
                  background: "linear-gradient(135deg,#FF6B00,#FF8C00)",
                  color: "#fff",
                  boxShadow: "0 0 20px rgba(255,107,0,0.4),0 4px 16px rgba(0,0,0,0.4)",
                }}>
                {waiting > 0 ? `Siguiente (${waiting}) →` : "¡A trabajar! 🔥"}
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="h-1 overflow-hidden" style={{ background: "rgba(255,107,0,0.1)" }}>
            <div className="h-full origin-left" style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg,#FF6B00,#FFD700)",
              boxShadow: "0 0 8px rgba(255,107,0,0.6)",
              transition: "width 80ms linear",
            }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: translateY(440px) rotate(540deg) scale(0.4); opacity: 0; }
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
