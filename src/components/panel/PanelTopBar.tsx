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

// WMO weather code → emoji
function weatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santo_Domingo",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    timeZone: "America/Santo_Domingo",
  });
}

const STORAGE_KEY = (slug: string) => `bookido_notif_seen_${slug}`;

export function PanelTopBar({ newsItems, tenantSlug }: Props) {
  const [time, setTime] = useState<Date | null>(null);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
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
    async function fetchWeather(lat: number, lon: number) {
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
          { next: { revalidate: 900 } } as RequestInit,
        );
        if (!r.ok) return;
        const d = await r.json();
        setWeather({ temp: Math.round(d.current.temperature_2m as number), code: d.current.weather_code as number });
      } catch { /* silent */ }
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => fetchWeather(p.coords.latitude, p.coords.longitude),
        () => fetchWeather(18.4861, -69.9312),
      );
    } else {
      fetchWeather(18.4861, -69.9312);
    }
  }, []);

  // News rotation every 6s
  useEffect(() => {
    if (!newsItems.length) return;
    const id = setInterval(() => setNewsIdx((i) => (i + 1) % newsItems.length), 6000);
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

      // Resolve service names
      const serviceIds = [...new Set(data.map((b) => b.service_id).filter(Boolean))];
      const { data: svcs } = await supabase!
        .from("bookido_services")
        .select("id, name")
        .in("id", serviceIds);

      const svcMap = Object.fromEntries((svcs ?? []).map((s) => [s.id, s.name]));

      setNotifs(
        data.map((b) => ({
          id: b.id,
          customer_name: b.customer_name,
          service_name: svcMap[b.service_id] ?? "Servicio",
          starts_at: b.starts_at,
          notes: b.notes ?? null,
          created_at: b.created_at,
        }))
      );
    }

    fetchNew();
    const id = setInterval(fetchNew, 30_000);
    return () => clearInterval(id);
  }, [tenantSlug]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpenBell() {
    setOpen((v) => !v);
    if (!open && notifs.length) {
      // Mark all as seen when opening
      localStorage.setItem(STORAGE_KEY(tenantSlug), new Date().toISOString());
    }
  }

  function clearNotifs() {
    localStorage.setItem(STORAGE_KEY(tenantSlug), new Date().toISOString());
    setNotifs([]);
    setOpen(false);
  }

  const timeStr = time
    ? time.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "America/Santo_Domingo" })
    : "—:—:—";

  return (
    <div className="relative flex items-center gap-3 border-b border-white/[0.05] bg-ink-950/90 px-4 py-2 text-xs text-zinc-500">
      {/* Clock */}
      <span className="flex-shrink-0 font-mono tabular-nums text-zinc-300">{timeStr}</span>
      <span className="flex-shrink-0 text-white/10">|</span>

      {/* Weather */}
      {weather ? (
        <>
          <span className="flex-shrink-0 text-zinc-400">{weatherIcon(weather.code)}&nbsp;{weather.temp}°C</span>
          <span className="flex-shrink-0 text-white/10">|</span>
        </>
      ) : (
        <>
          <span className="flex-shrink-0 text-zinc-600">🌡️ —°C</span>
          <span className="flex-shrink-0 text-white/10">|</span>
        </>
      )}

      {/* News ticker */}
      <span className="min-w-0 flex-1 truncate text-zinc-500">
        {newsItems.length > 0
          ? <>📰&nbsp;{newsItems[newsIdx]}</>
          : <span className="text-zinc-700">Noticias no disponibles</span>
        }
      </span>

      {/* Notification Bell */}
      <div ref={bellRef} className="relative flex-shrink-0">
        <button
          onClick={handleOpenBell}
          className="relative flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200"
          aria-label="Notificaciones"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifs.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
              {notifs.length > 9 ? "9+" : notifs.length}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-9 z-50 w-80 rounded-xl border border-white/[0.08] bg-ink-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <span className="text-xs font-semibold text-white">Nuevas reservas</span>
              {notifs.length > 0 && (
                <button onClick={clearNotifs} className="text-[10px] text-zinc-500 hover:text-zinc-300">
                  Marcar todas como vistas
                </button>
              )}
            </div>

            {notifs.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-zinc-600">
                Sin reservas nuevas desde tu última visita
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                {notifs.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-white">{n.customer_name}</p>
                        <p className="text-[11px] text-zinc-500">{n.service_name} · {formatDate(n.starts_at)} {formatTime(n.starts_at)}</p>
                        {n.notes && (
                          <p className="mt-1 rounded-md bg-white/[0.04] px-2 py-1 text-[11px] italic text-zinc-400">
                            "{n.notes}"
                          </p>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-[10px] text-zinc-600">{formatTime(n.created_at)}</span>
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
