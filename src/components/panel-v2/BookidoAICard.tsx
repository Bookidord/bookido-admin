"use client";

import { useState, useEffect } from "react";

interface Alert {
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  suggested_action: string;
}

interface Recommendation {
  title: string;
  description: string;
  action_label: string;
  action_url: string | null;
  priority: number;
}

interface BriefingData {
  tenant: string;
  tenant_name: string;
  date: string;
  summary: string;
  alerts: Alert[];
  recommendations: Recommendation[];
  generated_at: string;
  status: string;
  cost_usd: number;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-rose-500/10", text: "text-rose-400", label: "Alta" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Media" },
  low: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Baja" },
};

function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("es-DO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Santo_Domingo",
    });
  } catch {
    return "";
  }
}

export function BookidoAICard({
  tenantSlug,
  briefingData,
}: {
  tenantSlug: string;
  briefingData?: BriefingData | null;
}) {
  const [data, setData] = useState<BriefingData | null>(briefingData || null);
  const [loading, setLoading] = useState(!briefingData);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (briefingData) return;

    const fetchBriefing = async () => {
      try {
        const res = await fetch(`/api/ai-briefing/${tenantSlug}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [tenantSlug, briefingData]);

  if (loading) {
    return (
      <div
        className="rounded-xl border border-white/[0.06] p-5 animate-pulse"
        style={{ background: "var(--ink-900)" }}
      >
        <div className="h-4 bg-white/[0.06] rounded w-1/3 mb-3" />
        <div className="h-3 bg-white/[0.06] rounded w-full mb-2" />
        <div className="h-3 bg-white/[0.06] rounded w-2/3" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-xl border border-white/[0.06] p-5"
        style={{ background: "var(--ink-900)" }}
      >
        <p className="text-white/30 text-sm">Sin briefing disponible</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes bk-ai-glow {
          0%, 100% { box-shadow: 0 0 12px rgb(var(--accent) / 0.08); }
          50% { box-shadow: 0 0 20px rgb(var(--accent) / 0.15); }
        }
      `}</style>
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: "var(--ink-900)",
          borderColor: "rgb(var(--accent) / 0.2)",
          animation: "bk-ai-glow 4s ease-in-out infinite",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-3 flex items-center justify-between border-b"
          style={{
            background: "rgb(var(--accent) / 0.05)",
            borderColor: "rgb(var(--accent) / 0.1)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <span
              className="text-xs font-bold"
              style={{ color: "var(--accent-hex)" }}
            >
              Bookido AI
            </span>
            <span className="text-white/20 text-[10px]">·</span>
            <span className="text-white/30 text-[10px]">Tu co-pilot</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/20">
            Briefing de hoy
          </span>
        </div>

        {/* Summary */}
        <div className="px-5 py-4">
          <p className="text-sm text-white/80 leading-relaxed">{data.summary}</p>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="px-5 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-2">
              Alertas
            </p>
            <div className="space-y-2">
              {data.alerts.map((alert, i) => {
                const sev = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
                return (
                  <div
                    key={i}
                    className={`rounded-lg px-3 py-2.5 ${sev.bg}`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${sev.bg} ${sev.text} shrink-0 mt-0.5`}
                      >
                        {sev.label}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs ${sev.text}`}>{alert.message}</p>
                        <p className="text-[11px] text-white/30 mt-1">
                          {alert.suggested_action}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="px-5 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-2">
              Recomendaciones
            </p>
            <div className="space-y-2">
              {data.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="rounded-lg px-3 py-2.5 border border-white/[0.04] hover:border-white/[0.08] transition-all duration-[180ms]"
                  style={{ background: "rgb(var(--accent) / 0.03)" }}
                >
                  <p className="text-xs text-white/70 font-medium">
                    {rec.title}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {rec.description}
                  </p>
                  {rec.action_url && (
                    <a
                      href={rec.action_url}
                      className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
                      style={{
                        background: "rgb(var(--accent) / 0.1)",
                        color: "var(--accent-hex)",
                      }}
                    >
                      {rec.action_label}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="px-5 py-2 border-t flex items-center justify-between"
          style={{ borderColor: "rgb(var(--accent) / 0.08)" }}
        >
          <span className="text-[10px] text-white/20">
            Generado a las {formatTime(data.generated_at)}
          </span>
          <span className="text-[10px] text-white/10">
            {data.model}
          </span>
        </div>
      </div>
    </>
  );
}
