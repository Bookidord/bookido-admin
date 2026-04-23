"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

type DateEntry = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  date_type: string;
  label: string | null;
  month: number;
  day: number;
  daysUntil: number;
};

const TYPE_LABEL: Record<string, string> = {
  birthday:    "🎂 Cumpleaños",
  anniversary: "💍 Aniversario",
  other:       "⭐ Fecha especial",
};

export function UpcomingDatesWidget({ dates }: { dates: DateEntry[] }) {
  const [expanded, setExpanded] = useState(true);
  if (dates.length === 0) return null;

  const today = dates.filter((d) => d.daysUntil === 0);
  const soon  = dates.filter((d) => d.daysUntil > 0);

  return (
    <div className="rounded-xl border border-[#14F195]/20 bg-[#14F195]/[0.04] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#14F195]/10 text-base">🎂</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">
              Fechas especiales
              {today.length > 0 && (
                <span className="ml-2 rounded-full bg-[#14F195] px-2 py-0.5 text-[10px] font-bold text-[#0A0A0F]">
                  HOY {today.length}
                </span>
              )}
            </p>
            <p className="text-xs text-zinc-500">
              {dates.length} próxima{dates.length !== 1 ? "s" : ""} en los siguientes 14 días
            </p>
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="divide-y divide-white/[0.04] border-t border-white/[0.06]">
          {today.length > 0 && (
            <div className="px-5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#14F195]/70 py-1">Hoy</p>
            </div>
          )}
          {[...today, ...soon].map((d) => {
            const waMsg = d.date_type === "birthday"
              ? `Hola ${d.customer_name.split(" ")[0]}, hoy es tu cumpleaños y desde ${""} queremos desearte un feliz día 🎂🎉 ¡Ven a celebrar con nosotros, tienes un regalo especial esperándote!`
              : `Hola ${d.customer_name.split(" ")[0]}, en tu día especial queremos enviarte un saludo 🌟`;
            return (
              <div key={d.id} className={`flex items-center gap-3 px-5 py-3 ${d.daysUntil === 0 ? "bg-[#14F195]/[0.04]" : ""}`}>
                <div className="shrink-0 text-center w-10">
                  <p className="text-base font-semibold text-white leading-none">{d.day}</p>
                  <p className="text-[10px] text-zinc-500">{MONTHS[d.month - 1]}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-100 truncate">{d.customer_name}</p>
                  <p className="text-xs text-zinc-500">{TYPE_LABEL[d.date_type] ?? d.label ?? "Fecha"}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {d.daysUntil === 0 ? (
                    <span className="rounded-full bg-[#14F195]/10 px-2 py-0.5 text-[10px] font-semibold text-[#14F195]">Hoy 🎉</span>
                  ) : (
                    <span className="text-xs text-zinc-600">{d.daysUntil}d</span>
                  )}
                  {d.customer_phone && (
                    <a
                      href={`https://wa.me/${d.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(waMsg)}`}
                      target="_blank" rel="noopener noreferrer"
                      title="Enviar felicitación por WhatsApp"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500/15"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
