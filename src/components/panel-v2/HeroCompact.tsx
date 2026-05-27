"use client";

import { useState, useEffect, useRef } from "react";

function getGreeting(): string {
  const h = parseInt(new Date().toLocaleTimeString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Santo_Domingo" }), 10);
  if (h >= 5 && h < 12) return "Buenos días,";
  if (h >= 12 && h < 19) return "Buenas tardes,";
  return "Buenas noches,";
}

export function HeroCompact({
  tenantName,
  tenantSlug,
  accentHex,
  plan,
}: {
  tenantName: string;
  tenantSlug: string;
  accentHex: string;
  plan?: string;
}) {
  const [greeting, setGreeting] = useState("Buenas tardes,");
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shimmerClass, setShimmerClass] = useState("bk-shimmer-once");
  const urlRef = useRef<HTMLInputElement>(null);

  const reservaUrl = `https://${tenantSlug}.bookido.online/reserva`;

  useEffect(() => {
    setGreeting(getGreeting());
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reservaUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      urlRef.current?.select();
    }
  };

  const handleShimmerHover = () => {
    setShimmerClass("");
    requestAnimationFrame(() => {
      setShimmerClass("bk-shimmer-once");
    });
  };

  const letters = tenantName.split("");

  return (
    <>
      <style>{`
        @keyframes bk-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .bk-glow-hero {
          position: absolute;
          inset: 0;
          filter: blur(28px);
          opacity: 0.15;
          pointer-events: none;
          z-index: 0;
        }
        .bk-shimmer-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            transparent 0%,
            transparent 40%,
            rgba(255,255,255,0.15) 50%,
            transparent 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          mix-blend-mode: overlay;
        }
        .bk-shimmer-once {
          animation: bk-shimmer 2s linear 1;
          animation-delay: 3s;
        }
      `}</style>
      <div
        className="h-24 flex items-center justify-between px-6 shrink-0 relative overflow-hidden"
        style={{ background: "var(--ink-950)" }}
      >
        {/* Glow layer */}
        <div className="bk-glow-hero" style={{ background: accentHex }} />

        {/* Left: greeting + name */}
        <div className="relative z-10 min-w-0">
          <p className="text-white/30 text-sm mb-0.5">{greeting}</p>
          <h1
            className="flex items-baseline gap-0 flex-wrap relative"
            onMouseEnter={handleShimmerHover}
            style={{ position: "relative" }}
          >
            {letters.map((ch, i) => (
              <span
                key={i}
                className="inline-block text-2xl font-bold"
                style={{
                  fontFamily: "Instrument Serif, serif",
                  fontStyle: "italic",
                  color: accentHex,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 320ms var(--ease-glide), transform 320ms var(--ease-glide)",
                  transitionDelay: `${i * 40}ms`,
                }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
            {plan && (
              <span
                className="ml-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-center"
                style={{
                  background: "rgb(var(--accent) / 0.12)",
                  color: "var(--accent-hex)",
                }}
              >
                {plan}
              </span>
            )}
            <span className={`bk-shimmer-overlay ${shimmerClass}`} />
          </h1>
        </div>

        {/* Right: URL row */}
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <div
            className="flex items-center rounded-lg border border-white/[0.06] overflow-hidden"
            style={{ background: "var(--ink-900)" }}
          >
            <input
              ref={urlRef}
              type="text"
              readOnly
              value={reservaUrl}
              className="bg-transparent text-white/40 text-xs px-3 py-2 w-64 outline-none cursor-default"
              tabIndex={-1}
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-xs font-medium transition-all duration-[180ms] border-l border-white/[0.06]"
              style={{
                color: copied ? "var(--accent-hex)" : "rgba(255,255,255,0.5)",
                background: copied ? "rgb(var(--accent) / 0.08)" : "transparent",
              }}
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
