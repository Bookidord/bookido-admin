"use client";

import { useState, useEffect } from "react";

type Props = { newsItems: string[] };

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

export function PanelTopBar({ newsItems }: Props) {
  const [time, setTime] = useState<Date | null>(null);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [newsIdx, setNewsIdx] = useState(0);

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
        setWeather({
          temp: Math.round(d.current.temperature_2m as number),
          code: d.current.weather_code as number,
        });
      } catch { /* silent */ }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => fetchWeather(p.coords.latitude, p.coords.longitude),
        () => fetchWeather(18.4861, -69.9312), // Santo Domingo fallback
      );
    } else {
      fetchWeather(18.4861, -69.9312);
    }
  }, []);

  // News rotation every 6 s
  useEffect(() => {
    if (!newsItems.length) return;
    const id = setInterval(() => setNewsIdx((i) => (i + 1) % newsItems.length), 6000);
    return () => clearInterval(id);
  }, [newsItems.length]);

  const timeStr = time
    ? time.toLocaleTimeString("es-DO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "America/Santo_Domingo",
      })
    : "—:—:—";

  return (
    <div className="flex items-center gap-3 border-b border-white/[0.05] bg-ink-950/90 px-4 py-2 text-xs text-zinc-500">
      {/* Clock */}
      <span className="flex-shrink-0 font-mono tabular-nums text-zinc-300">{timeStr}</span>

      <span className="flex-shrink-0 text-white/10">|</span>

      {/* Weather */}
      {weather ? (
        <>
          <span className="flex-shrink-0 text-zinc-400">
            {weatherIcon(weather.code)}&nbsp;{weather.temp}°C
          </span>
          <span className="flex-shrink-0 text-white/10">|</span>
        </>
      ) : (
        <>
          <span className="flex-shrink-0 text-zinc-600">🌡️ —°C</span>
          <span className="flex-shrink-0 text-white/10">|</span>
        </>
      )}

      {/* News ticker */}
      {newsItems.length > 0 ? (
        <span className="min-w-0 truncate text-zinc-500 transition-all duration-500">
          📰&nbsp;{newsItems[newsIdx]}
        </span>
      ) : (
        <span className="text-zinc-700">Noticias no disponibles</span>
      )}
    </div>
  );
}
