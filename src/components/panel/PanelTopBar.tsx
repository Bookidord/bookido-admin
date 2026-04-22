"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = { newsItems: string[]; tenantSlug: string };

type Notif = {
  id: string;
  customer_name: string;
  service_name: string;
  starts_at: string;
  notes: string | null;
  created_at: string;
};

type WeatherState = { temp: number; code: number; city: string };

// WMO code → visual theme
function weatherTheme(code: number | null): { bg: string; glow: string; emoji: string; label: string } {
  if (code === null)        return { bg: "from-zinc-900/80 to-zinc-950/80", glow: "", emoji: "🌡️", label: "" };
  if (code === 0)           return { bg: "from-amber-950/60 via-orange-950/40 to-ink-950/80", glow: "shadow-[0_1px_12px_0_rgba(251,146,60,0.18)]", emoji: "☀️", label: "Despejado" };
  if (code <= 3)            return { bg: "from-sky-950/50 via-slate-900/60 to-ink-950/80", glow: "shadow-[0_1px_12px_0_rgba(56,189,248,0.12)]", emoji: "⛅", label: "Parcialmente nublado" };
  if (code <= 48)           return { bg: "from-slate-800/60 to-ink-950/80", glow: "", emoji: "🌫️", label: "Neblina" };
  if (code <= 67)           return { bg: "from-blue-950/60 via-slate-900/60 to-ink-950/80", glow: "shadow-[0_1px_12px_0_rgba(96,165,250,0.15)]", emoji: "🌧️", label: "Lluvia" };
  if (code <= 77)           return { bg: "from-indigo-950/60 to-ink-950/80", glow: "", emoji: "❄️", label: "Nieve" };
  if (code <= 82)           return { bg: "from-cyan-950/50 via-blue-950/40 to-ink-950/80", glow: "shadow-[0_1px_10px_0_rgba(34,211,238,0.12)]", emoji: "🌦️", label: "Chubascos" };
  return                     { bg: "from-purple-950/60 via-slate-900/60 to-ink-950/80", glow: "shadow-[0_1px_12px_0_rgba(192,132,252,0.15)]", emoji: "⛈️", label: "Tormenta" };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Santo_Domingo" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-DO", { day: "numeric", month: "short", timeZone: "America/Santo_Domingo" });
}

const STORAGE_KEY = (slug: string) => `bookido_notif_seen_${slug}`;

export function PanelTopBar({ newsItems, tenantSlug }: Props) {
  const [time, setTime] = useState<Date | null>(null);
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [newsIdx, setNewsIdx] = useState(0);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Hydration-safe clock
  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Weather: geolocation → Open-Meteo
  useEffect(() => {
    async function fetchWeather(lat: number, lon: number, city: string) {
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
          { cache: "no-store" } as RequestInit,
        );
        if (!r.ok) return;
        const d = await r.json();
        setWeather({ temp: Math.round(d.current.temperature_2m as number), code: d.current.weather_code as number, city });
      } catch { /* silent */ }
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => fetchWeather(p.coords.latitude, p.coords.longitude, ""),
        () => fetchWeather(18.4861, -69.9312, "Santo Domingo"),
      );
    } else {
      fetchWeather(18.4861, -69.9312, "Santo Domingo");
    }
  }, []);

  // News rotation every 7s
  useEffect(() => {
    if (!newsItems.length) return;
    const id = setInterval(() => setNewsIdx((i) => (i + 1) % newsItems.length), 7000);
    return () => clearInterval(id);
  }, [newsItems.length]);

  // Poll new bookings every 30s
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    async function fetchNew() {
      const lastSeen = localStorage.getItem(STORAGE_KEY(tenantSlug)) ?? new Date(0).toISOString();
      const { data } = await supabase!
        .from("bookido_bookings")
        .select("id, customer_name, service_id, starts_at, notes, created_at")
        .eq("tenant_slug", tenantSlug)
        .gt("created_at", lastSeen)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!data?.length) return;

      const serviceIds = [...new Set(data.map((b) => b.service_id).filter(Boolean))];
      const { data: svcs } = await supabase!.from("bookido_services").select("id, name").in("id", serviceIds);
      const svcMap = Object.fromEntries((svcs ?? []).map((s) => [s.id, s.name]));

      setNotifs(data.map((b) => ({
        id: b.id,
        customer_name: b.customer_name,
        service_name: svcMap[b.service_id] ?? "Servicio",
        starts_at: b.starts_at,
        notes: b.notes ?? null,
        created_at: b.created_at,
      })));
    }

    fetchNew();
    const id = setInterval(fetchNew, 30_000);
    return () => clearInterval(id);
  }, [tenantSlug]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpenBell() {
    const next = !open;
    setOpen(next);
    if (next && notifs.length) localStorage.setItem(STORAGE_KEY(tenantSlug), new Date().toISOString());
  }
  function clearNotifs() {
    localStorage.setItem(STORAGE_KEY(tenantSlug), new Date().toISOString());
    setNotifs([]);
    setOpen(false);
  }

  const theme = weatherTheme(weather?.code ?? null);

  const timeStr = time
    ? time.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "America/Santo_Domingo" })
    : "—:—:—";

  const dateStr = time
    ? time.toLocaleDateString("es-DO", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Santo_Domingo" })
    : "";

  return (
    <div className={`relative flex items-center gap-0 border-b border-white/[0.06] bg-gradient-to-r ${theme.bg} ${theme.glow} px-4 py-0`} style={{ minHeight: 64 }}>

      {/* Clock + date */}
      <div className="flex flex-col justify-center pr-5 border-r border-white/[0.07]" style={{ minWidth: 110 }}>
        <span className="font-mono text-lg font-semibold tabular-nums leading-tight text-white tracking-tight">
          {timeStr.slice(0, 5)}
          <span className="text-zinc-500 text-sm ml-0.5">{timeStr.slice(5)}</span>
        </span>
        <span className="text-[10px] text-zinc-500 capitalize mt-0.5">{dateStr}</span>
      </div>

      {/* Weather block */}
      <div className="flex flex-col justify-center px-5 border-r border-white/[0.07]" style={{ minWidth: 120 }}>
        {weather ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xl leading-none">{theme.emoji}</span>
              <span className="text-xl font-semibold text-white leading-none">{weather.temp}°</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5">
              {weather.city || "Tu ubicación"}{theme.label ? ` · ${theme.label}` : ""}
            </span>
          </>
        ) : (
          <>
            <span className="text-xl text-zinc-600">🌡️ —°</span>
            <span className="text-[10px] text-zinc-600 mt-0.5">Cargando clima…</span>
          </>
        )}
      </div>

      {/* News ticker */}
      <div className="flex-1 min-w-0 flex flex-col justify-center px-5 overflow-hidden">
        {newsItems.length > 0 ? (
          <>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600 mb-0.5">Noticias RD</span>
            <p className="truncate text-[12px] text-zinc-300 leading-snug">{newsItems[newsIdx]}</p>
          </>
        ) : (
          <>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-700 mb-0.5">Noticias RD</span>
            <p className="text-[12px] text-zinc-600">Sin conexión a fuentes locales</p>
          </>
        )}
      </div>

      {/* Bell */}
      <div ref={bellRef} className="relative flex-shrink-0 pl-4">
        <button
          onClick={handleOpenBell}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/[0.07] hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifs.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-bold text-black animate-pulse">
              {notifs.length > 9 ? "9+" : notifs.length}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <span className="text-xs font-semibold text-white">
                🔔 Reservas nuevas
                {notifs.length > 0 && <span className="ml-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400">{notifs.length}</span>}
              </span>
              {notifs.length > 0 && (
                <button onClick={clearNotifs} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition">
                  Marcar vistas
                </button>
              )}
            </div>
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-xs text-zinc-500">Sin reservas nuevas desde tu última visita</p>
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                {notifs.map((n) => (
                  <li key={n.id} className="px-4 py-3 hover:bg-white/[0.03] transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">{n.customer_name}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{n.service_name} · {formatDate(n.starts_at)} {formatTime(n.starts_at)}</p>
                        {n.notes && (
                          <p className="mt-1.5 rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-[11px] italic text-zinc-300 border border-white/[0.04]">
                            "{n.notes}"
                          </p>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-[10px] text-zinc-600 mt-0.5">{formatTime(n.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
