"use client";

import { useState, useEffect, useRef } from "react";

export interface MetricCard {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: string;
  sparkline: number[];
}

function parseNumericValue(val: string): { prefix: string; num: number; suffix: string } {
  const match = val.match(/^([^\d]*)([\d,]+)(.*)/);
  if (!match) return { prefix: "", num: 0, suffix: val };
  return {
    prefix: match[1],
    num: parseInt(match[2].replace(/,/g, ""), 10),
    suffix: match[3],
  };
}

function formatWithCommas(n: number): string {
  return n.toLocaleString("en-US");
}

function CountUp({ value, duration = 800 }: { value: string; duration?: number }) {
  const { prefix, num, suffix } = parseNumericValue(value);
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (num === 0) { setCurrent(0); return; }
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * num));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [num, duration]);

  return <>{prefix}{formatWithCommas(current)}{suffix}</>;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 56;
  const h = 20;
  const points = data.map(
    (v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`
  );
  const d = "M" + points.join(" L");
  const totalLength = w * 2;

  return (
    <>
      <style>{`
        @keyframes bk-spark-draw {
          0% { stroke-dashoffset: ${totalLength}; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
      <svg width={w} height={h} className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: totalLength,
            strokeDashoffset: 0,
            animation: `bk-spark-draw 900ms var(--ease-snap) forwards`,
          }}
        />
      </svg>
    </>
  );
}

export function MetricRowCompact({
  metrics,
  accentHex,
}: {
  metrics: MetricCard[];
  accentHex: string;
}) {
  return (
    <div
      className="h-[100px] flex items-stretch gap-3 px-6 py-3 shrink-0"
      style={{ background: "var(--ink-950)" }}
    >
      {metrics.map((m) => (
        <div
          key={m.label}
          className="group flex-1 flex items-center gap-3 rounded-xl border border-white/[0.06] px-4 overflow-hidden hover:border-white/[0.1] transition-all duration-[180ms]"
          style={{ background: "var(--ink-900)" }}
        >
          {/* Accent bar left */}
          <div
            className="w-[3px] self-stretch -ml-4 shrink-0 rounded-r-full"
            style={{ background: accentHex }}
          />

          {/* Content */}
          <div className="flex-1 min-w-0 ml-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs">{m.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 truncate">
                {m.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                <CountUp value={m.value} />
              </span>
              <span
                className={`text-[11px] ${
                  m.trendUp ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {m.trend}
              </span>
            </div>
          </div>

          {/* Sparkline */}
          <Sparkline data={m.sparkline} color={accentHex} />
        </div>
      ))}
    </div>
  );
}
