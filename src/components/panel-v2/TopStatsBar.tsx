"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function TopStatsBar() {
  const [display, setDisplay] = useState("");
  const [showSeconds, setShowSeconds] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [bellPopped, setBellPopped] = useState(false);
  const lastMinuteRef = useRef<number>(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = useCallback((withSeconds: boolean) => {
    const opts: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Santo_Domingo",
    };
    if (withSeconds) opts.second = "2-digit";
    return new Date().toLocaleTimeString("es-DO", opts);
  }, []);

  const tick = useCallback((withSeconds: boolean) => {
    const now = new Date();
    const currentMinute = now.getMinutes();
    if (lastMinuteRef.current !== -1 && currentMinute !== lastMinuteRef.current) {
      setPulse(true);
      setTimeout(() => setPulse(false), 180);
    }
    lastMinuteRef.current = currentMinute;
    setDisplay(formatTime(withSeconds));
  }, [formatTime]);

  // Setup interval based on hover state
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    tick(showSeconds);
    const ms = showSeconds ? 1000 : 60000;
    intervalRef.current = setInterval(() => tick(showSeconds), ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [showSeconds, tick]);

  useEffect(() => {
    const popT = setTimeout(() => setBellPopped(true), 600);
    return () => clearTimeout(popT);
  }, []);

  return (
    <>
      <style>{`
        @keyframes bk-marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes bk-weather-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bk-bell-pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bk-minute-pulse {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
      <div
        className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] shrink-0"
        style={{ background: "var(--ink-900)" }}
      >
        {/* Left: clock + weather */}
        <div className="flex items-center gap-6 shrink-0">
          <div
            className="flex items-center gap-2 cursor-default"
            onMouseEnter={() => setShowSeconds(true)}
            onMouseLeave={() => setShowSeconds(false)}
          >
            <span className="text-white/30 text-xs">🕐</span>
            <span
              className="text-white/70 text-sm tabular-nums"
              style={{
                fontFamily: "monospace",
                letterSpacing: "0.02em",
                transition: "opacity 200ms ease",
                animation: pulse ? "bk-minute-pulse 180ms ease" : "none",
              }}
            >
              {display || "--:-- --"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0"
              style={{ animation: "bk-weather-rotate 60s linear infinite" }}
            >
              <circle cx="12" cy="12" r="5" fill="#FBBF24" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <line
                  key={deg}
                  x1="12"
                  y1="2"
                  x2="12"
                  y2="5"
                  stroke="#FBBF24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform={`rotate(${deg} 12 12)`}
                />
              ))}
            </svg>
            <span className="text-white/50 text-xs">Santo Domingo · 31°C</span>
          </div>
        </div>

        {/* Center: ticker */}
        <div className="flex-1 mx-8 overflow-hidden relative h-5">
          <div
            className="absolute whitespace-nowrap text-white/25 text-xs leading-5"
            style={{ animation: "bk-marquee 25s linear infinite" }}
          >
            🇩🇴 Buenos días desde Bookido — Tu negocio, automatizado — Reservas en piloto automático — Más tiempo para ti, más clientes para tu negocio
          </div>
        </div>

        {/* Right: bell */}
        <button className="relative p-2 rounded-lg hover:bg-white/[0.03] transition-all duration-[180ms] shrink-0">
          <span className="text-lg">🔔</span>
          <span
            className="absolute top-0.5 right-0.5 w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center text-white"
            style={{
              background: "var(--accent-hex)",
              animation: bellPopped ? "bk-bell-pop 420ms var(--ease-snap) forwards" : "none",
              opacity: bellPopped ? 1 : 0,
            }}
          >
            3
          </span>
        </button>
      </div>
    </>
  );
}
