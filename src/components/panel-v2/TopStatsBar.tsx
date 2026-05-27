"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Booking = {
  id: string;
  customer_name: string;
  starts_at: string;
  status: string;
  service_name?: string;
};

export function TopStatsBar() {
  const [display, setDisplay] = useState("");
  const [greeting, setGreeting] = useState("Buenos d\u00edas");
  const [showSeconds, setShowSeconds] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const lastMinuteRef = useRef<number>(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

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
    // Update greeting based on Santo Domingo hour
    const sdHour = parseInt(new Date().toLocaleTimeString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Santo_Domingo" }), 10);
    if (sdHour >= 5 && sdHour < 12) setGreeting("Buenos d\u00edas");
    else if (sdHour >= 12 && sdHour < 18) setGreeting("Buenas tardes");
    else setGreeting("Buenas noches");
  }, [formatTime]);

  // Fetch today's bookings
  const fetchBookings = useCallback(async () => {
    try {
      const tenantSlug = window.location.hostname.split(".")[0];
      const now = new Date();
      const todayStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const todayEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data } = await supabase
        .from("bookido_bookings")
        .select("id, customer_name, starts_at, status")
        .eq("tenant_slug", tenantSlug)
        .gte("starts_at", todayStart)
        .lt("starts_at", todayEnd)
        .order("starts_at", { ascending: true });

      if (data) {
        setTodayBookings(data);
        setPendingCount(data.filter((b: Booking) => b.status === "confirmed" || b.status === "pending").length);
      }
    } catch {}
  }, [supabase]);

  // Clock interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    tick(showSeconds);
    const ms = showSeconds ? 1000 : 60000;
    intervalRef.current = setInterval(() => tick(showSeconds), ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [showSeconds, tick]);

  // Fetch bookings on mount + every 30s
  useEffect(() => {
    fetchBookings();
    const id = setInterval(fetchBookings, 30000);
    return () => clearInterval(id);
  }, [fetchBookings]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = () => setBellOpen(false);
    setTimeout(() => document.addEventListener("click", handler), 100);
    return () => document.removeEventListener("click", handler);
  }, [bellOpen]);

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
            <span className="text-white/30 text-xs">{"\ud83d\udd50"}</span>
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
              width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0"
              style={{ animation: "bk-weather-rotate 60s linear infinite" }}
            >
              <circle cx="12" cy="12" r="5" fill="#FBBF24" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <line key={deg} x1="12" y1="2" x2="12" y2="5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" transform={`rotate(${deg} 12 12)`} />
              ))}
            </svg>
            <span className="text-white/50 text-xs">Santo Domingo</span>
          </div>
        </div>

        {/* Center: ticker */}
        <div className="flex-1 mx-8 overflow-hidden relative h-5">
          <div className="absolute whitespace-nowrap text-white/25 text-xs leading-5" style={{ animation: "bk-marquee 25s linear infinite" }}>
            {"\ud83c\udde9\ud83c\uddf4"} {greeting} desde Bookido — Tu negocio, automatizado — Reservas en piloto autom{"\u00e1"}tico — M{"\u00e1"}s tiempo para ti, m{"\u00e1"}s clientes para tu negocio
          </div>
        </div>

        {/* Right: bell with real notifications */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setBellOpen(!bellOpen); fetchBookings(); }}
            className="relative p-2 rounded-lg hover:bg-white/[0.03] transition-all duration-[180ms] shrink-0"
          >
            <span className="text-lg">{"\ud83d\udd14"}</span>
            {pendingCount > 0 && (
              <span
                className="absolute top-0.5 right-0.5 w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: "var(--accent-hex)" }}
              >
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {bellOpen && (
            <div
              className="absolute right-0 top-12 w-80 rounded-xl border border-white/[0.06] shadow-2xl z-50 overflow-hidden"
              style={{ background: "var(--ink-900)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-white/[0.04]">
                <p className="text-xs font-bold text-white">Reservas recientes</p>
                <p className="text-[10px] text-white/30 mt-0.5">{todayBookings.length} reserva{todayBookings.length !== 1 ? "s" : ""}</p>
              </div>
              {todayBookings.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-white/20 text-xs">Sin reservas para hoy</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {todayBookings.map((b) => {
                    const time = new Date(b.starts_at).toLocaleTimeString("es-DO", {
                      timeZone: "America/Santo_Domingo", hour: "2-digit", minute: "2-digit",
                    });
                    const statusColor: Record<string, string> = {
                      confirmed: "text-emerald-400",
                      pending: "text-amber-400",
                      completed: "text-blue-400",
                      cancelled: "text-red-400",
                      no_show: "text-zinc-400",
                    };
                    const statusLabel: Record<string, string> = {
                      confirmed: "Confirmada",
                      pending: "Pendiente",
                      completed: "Completada",
                      cancelled: "Cancelada",
                      no_show: "No-show",
                    };
                    return (
                      <a key={b.id} href="/panel/reservas" className="px-4 py-2.5 border-b border-white/[0.03] last:border-0 flex items-center gap-3 hover:bg-white/[0.03] transition-all cursor-pointer">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ background: "rgb(var(--accent) / 0.15)", color: "var(--accent-hex)" }}
                        >
                          {b.customer_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{b.customer_name}</p>
                          <p className="text-[10px] text-white/30">{time}</p>
                        </div>
                        <span className={`text-[10px] font-medium ${statusColor[b.status] || "text-zinc-400"}`}>
                          {statusLabel[b.status] || b.status}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
              <a href="/panel/reservas" className="block px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider border-t border-white/[0.04] hover:bg-white/[0.03] transition" style={{ color: "var(--accent-hex)" }}>
                Ver todas
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
