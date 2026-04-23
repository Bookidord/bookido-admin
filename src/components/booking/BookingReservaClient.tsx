"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  addDays, addMinutes, endOfDay, format, isAfter, setHours, setMinutes, startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { createBookingAction, getBusyIntervalsAction } from "@/app/reserva/actions";
import type { ServiceRow } from "@/lib/booking/types";

export type ScheduleConfig = { openHour: number; closeHour: number; slotMinutes: number };

type Props = { services: ServiceRow[]; configured: boolean; tenantSlug: string; schedule: ScheduleConfig };

function generateSlots(
  day: Date,
  durationMinutes: number,
  busy: { starts_at: string; ends_at: string }[],
  schedule: ScheduleConfig,
): Date[] {
  const dayStart = startOfDay(day);
  const close = setMinutes(setHours(dayStart, schedule.closeHour), 0);
  let t = setMinutes(setHours(dayStart, schedule.openHour), 0);
  const out: Date[] = [];
  while (true) {
    const end = addMinutes(t, durationMinutes);
    if (isAfter(end, close)) break;
    const overlaps = busy.some((b) => t < new Date(b.ends_at) && end > new Date(b.starts_at));
    if (!overlaps) out.push(t);
    t = addMinutes(t, schedule.slotMinutes);
  }
  return out;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = "service" | "date" | "time" | "name" | "email" | "phone" | "confirm" | "done";
type Option = { label: string; value: string; sub?: string };
type ChatMsg = { id: string; from: "bot" | "user" | "typing"; text?: string };

let _id = 0;
const uid = () => String(++_id);
const BOT_DELAY = 650;

// ── Component ─────────────────────────────────────────────────────────────────
export function BookingReservaClient({ services, configured, tenantSlug, schedule }: Props) {
  const params = useSearchParams();
  const preselectId = params.get("service") ?? "";

  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [step, setStep] = useState<Step>("service");
  const [pendingOptions, setPendingOptions] = useState<Option[] | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputMeta, setInputMeta] = useState<{ placeholder: string; type: string }>({ placeholder: "", type: "text" });
  const [textInput, setTextInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Booking data
  const [serviceId, setServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [busy, setBusy] = useState<{ starts_at: string; ends_at: string }[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function scrollBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  const pushMsg = useCallback((msg: ChatMsg) => {
    setMsgs((m) => [...m, msg]);
    scrollBottom();
  }, []);

  const replaceTyping = useCallback((msg: ChatMsg) => {
    setMsgs((m) => [...m.filter((x) => x.from !== "typing"), msg]);
    scrollBottom();
  }, []);

  function userSay(text: string) {
    pushMsg({ id: uid(), from: "user", text });
  }

  function botSay(
    text: string,
    opts?: Option[],
    withInput = false,
    meta?: { placeholder: string; type: string },
  ) {
    pushMsg({ id: uid(), from: "typing" });
    setTimeout(() => {
      replaceTyping({ id: uid(), from: "bot", text });
      setPendingOptions(opts ?? null);
      setShowInput(withInput);
      if (meta) setInputMeta(meta);
      setTextInput("");
      setFormError(null);
      scrollBottom();
      if (withInput) setTimeout(() => inputRef.current?.focus(), 120);
    }, BOT_DELAY);
  }

  function makeDateOptions() {
    const today = startOfDay(new Date());
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, i);
      let lbl = i === 0 ? "Hoy" : i === 1 ? "Mañana" : format(d, "EEE d MMM", { locale: es });
      lbl = lbl.charAt(0).toUpperCase() + lbl.slice(1);
      return { label: lbl, value: d.toISOString() };
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!configured) {
      pushMsg({ id: uid(), from: "bot", text: "El sistema de reservas no está configurado aún." });
      return;
    }
    if (services.length === 0) {
      pushMsg({ id: uid(), from: "bot", text: "No hay servicios disponibles en este momento." });
      return;
    }
    const svcOptions = services.map((s) => ({ label: s.name, value: s.id, sub: `${s.duration_minutes} min` }));
    pushMsg({ id: uid(), from: "bot", text: "¡Hola! 👋 ¿Qué servicio deseas reservar hoy?" });
    setTimeout(() => setPendingOptions(svcOptions), 80);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step handlers ──────────────────────────────────────────────────────────
  function pickService(id: string, label: string) {
    setPendingOptions(null);
    userSay(label);
    setServiceId(id);
    setStep("date");
    botSay("¿Qué día te viene bien?", makeDateOptions());
  }

  async function pickDate(iso: string, label: string) {
    setPendingOptions(null);
    userSay(label);
    const d = new Date(iso);
    setSelectedDate(d);
    setStep("time");

    pushMsg({ id: uid(), from: "typing" });
    setSlotLoading(true);

    const res = await getBusyIntervalsAction(
      tenantSlug,
      startOfDay(d).toISOString(),
      endOfDay(d).toISOString(),
    );
    setSlotLoading(false);
    const intervals = res.ok ? res.intervals : [];
    setBusy(intervals);

    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    const computed = generateSlots(d, svc.duration_minutes, intervals, schedule);

    if (computed.length === 0) {
      replaceTyping({ id: uid(), from: "bot", text: "Ese día no tiene horarios disponibles. ¿Elegimos otro?" });
      setPendingOptions(makeDateOptions());
      setStep("date");
      return;
    }

    const slotOpts: Option[] = computed.map((s) => ({ label: format(s, "HH:mm"), value: s.toISOString() }));
    replaceTyping({ id: uid(), from: "bot", text: "¿A qué hora?" });
    setPendingOptions(slotOpts);
    scrollBottom();
  }

  function pickTime(iso: string, label: string) {
    setPendingOptions(null);
    userSay(label);
    setSelectedSlot(new Date(iso));
    setStep("name");
    botSay("¿Cuál es tu nombre?", undefined, true, { placeholder: "Tu nombre completo", type: "text" });
  }

  function submitName() {
    const val = textInput.trim();
    if (!val) return;
    setShowInput(false);
    userSay(val);
    setName(val);
    setStep("phone");
    botSay("¿Tu número de teléfono?", undefined, true, { placeholder: "8091234567", type: "tel" });
  }

  function submitPhone(skip = false) {
    const val = skip ? "" : textInput.trim();
    if (!skip && !val) { setFormError("Ingresa tu teléfono."); return; }
    setShowInput(false);
    userSay(val || "Sin teléfono");
    setPhone(val);

    const svc = services.find((s) => s.id === serviceId);
    const d = selectedDate ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) : "";
    const t = selectedSlot ? format(selectedSlot, "HH:mm") : "";
    const dCap = d.charAt(0).toUpperCase() + d.slice(1);

    setStep("confirm");
    botSay(
      `Listo, aquí está tu reserva:\n\n📌 ${svc?.name}\n📅 ${dCap}\n🕐 ${t}\n👤 ${name}\n📱 ${val}\n\n¿Confirmo?`,
      [
        { label: "✅ Confirmar", value: "confirm" },
        { label: "✏️ Cambiar algo", value: "restart" },
      ],
    );
  }

  function handleConfirmOption(value: string) {
    setPendingOptions(null);
    if (value === "restart") {
      userSay("Cambiar algo");
      handleRestart();
      return;
    }
    userSay("Confirmar");
    if (!service || !selectedSlot) return;
    pushMsg({ id: uid(), from: "typing" });
    startTransition(async () => {
      const res = await createBookingAction({
        tenantSlug,
        serviceId: service.id,
        startsAtISO: selectedSlot.toISOString(),
        customerName: name,
        customerEmail: email,
        customerPhone: phone || undefined,
      });
      if (res.ok) {
        const dateStr = format(selectedSlot, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
        const dateCap = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        replaceTyping({
          id: uid(), from: "bot",
          text: `¡Reserva confirmada! 🎉\n\nTe esperamos el ${dateCap}.\n\n¡Hasta pronto, ${name.split(" ")[0]}! 💅`,
        });
        setPendingOptions([{ label: "Nueva reserva", value: "new" }]);
        setStep("done");
      } else {
        replaceTyping({ id: uid(), from: "bot", text: `Hubo un error: ${res.error}. ¿Intentamos de nuevo?` });
        setPendingOptions([
          { label: "✅ Confirmar", value: "confirm" },
          { label: "✏️ Cambiar algo", value: "restart" },
        ]);
        setStep("confirm");
      }
    });
  }

  function handleRestart() {
    setServiceId(""); setSelectedDate(null); setSelectedSlot(null);
    setName(""); setEmail(""); setPhone("");
    setBusy([]); setTextInput(""); setShowInput(false); setPendingOptions(null);
    setMsgs([]);
    setStep("service");
    const svcOptions = services.map((s) => ({ label: s.name, value: s.id, sub: `${s.duration_minutes} min` }));
    setTimeout(() => {
      pushMsg({ id: uid(), from: "bot", text: "¡Claro! Empecemos de nuevo. ¿Qué servicio deseas?" });
      setTimeout(() => setPendingOptions(svcOptions), BOT_DELAY + 80);
    }, 100);
  }

  function handleOptionClick(opt: Option) {
    if (step === "service") pickService(opt.value, opt.label);
    else if (step === "date") void pickDate(opt.value, opt.label);
    else if (step === "time") pickTime(opt.value, opt.label);
    else if (step === "confirm") handleConfirmOption(opt.value);
    else if (step === "done" && opt.value === "new") handleRestart();
  }

  function handleSend() {
    if (step === "name") submitName();
    else if (step === "phone") submitPhone(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // email step removed — skip it in Step type usage

  // ── Options layout ─────────────────────────────────────────────────────────
  function renderOptions() {
    if (!pendingOptions || pendingOptions.length === 0) return null;

    if (step === "date") {
      // Horizontal scroll strip
      return (
        <div className="flex gap-2 overflow-x-auto pb-1 pl-9 scrollbar-none">
          {pendingOptions.map((opt) => (
            <button key={opt.value} type="button" onClick={() => handleOptionClick(opt)}
              disabled={isPending || slotLoading}
              className="shrink-0 rounded-xl border border-white/[0.12] bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 transition hover:border-[color:var(--primary-hex,#14F195)]/50 hover:bg-zinc-700/60 disabled:opacity-40">
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    if (step === "time") {
      // 3-column grid
      return (
        <div className="grid grid-cols-3 gap-2 pl-9 sm:grid-cols-4">
          {pendingOptions.map((opt) => (
            <button key={opt.value} type="button" onClick={() => handleOptionClick(opt)}
              disabled={isPending}
              className="rounded-xl border border-white/[0.12] bg-zinc-800/60 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[color:var(--primary-hex,#14F195)]/50 hover:bg-zinc-700/60 disabled:opacity-40">
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    if (step === "confirm" || step === "done") {
      return (
        <div className="flex flex-wrap gap-2 pl-9">
          {pendingOptions.map((opt) => (
            <button key={opt.value} type="button" onClick={() => handleOptionClick(opt)}
              disabled={isPending}
              className="rounded-xl border border-white/[0.12] bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[color:var(--primary-hex,#14F195)]/50 hover:bg-zinc-700/60 disabled:opacity-40">
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    // Default: vertical list (services)
    return (
      <div className="flex flex-col gap-2 pl-9">
        {pendingOptions.map((opt) => (
          <button key={opt.value} type="button" onClick={() => handleOptionClick(opt)}
            disabled={isPending}
            className="flex items-center justify-between rounded-xl border border-white/[0.12] bg-zinc-800/60 px-4 py-3 text-left text-sm transition hover:border-[color:var(--primary-hex,#14F195)]/50 hover:bg-zinc-700/60 disabled:opacity-40">
            <span className="font-medium text-zinc-100">{opt.label}</span>
            {opt.sub && <span className="text-xs text-zinc-500">{opt.sub}</span>}
          </button>
        ))}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-6">

        {msgs.map((msg) => {
          if (msg.from === "typing") {
            return (
              <div key={msg.id} className="flex items-end gap-2">
                <BotAvatar />
                <div className="rounded-2xl rounded-bl-sm bg-zinc-800/80 px-4 py-3">
                  <span className="flex items-center gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            );
          }
          if (msg.from === "bot") {
            return (
              <div key={msg.id} className="flex items-end gap-2">
                <BotAvatar />
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-zinc-800/80 px-4 py-3 text-sm leading-relaxed text-zinc-100 whitespace-pre-line">
                  {msg.text}
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-3 text-sm font-medium"
                style={{ background: "var(--primary-hex, #14F195)", color: "#0A0A0F" }}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Pending options */}
        {renderOptions()}

        {/* Error */}
        {formError && (
          <p className="pl-9 text-xs text-red-400">{formError}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Text input bar */}
      {showInput && (
        <div className="shrink-0 border-t border-white/[0.07] bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type={inputMeta.type}
              value={textInput}
              onChange={(e) => { setTextInput(e.target.value); setFormError(null); }}
              onKeyDown={handleKeyDown}
              placeholder={inputMeta.placeholder}
              autoComplete={inputMeta.type === "email" ? "email" : inputMeta.type === "tel" ? "tel" : "name"}
              className="flex-1 rounded-xl border border-white/[0.08] bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-[color:var(--primary-hex,#14F195)]/50"
            />
            <button type="button" onClick={handleSend} disabled={isPending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition hover:opacity-90 disabled:opacity-40"
              style={{ background: "var(--primary-hex, #14F195)" }}>
              <svg className="h-4 w-4" fill="none" stroke="#0A0A0F" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base"
      style={{ background: "var(--primary-hex, #14F195)" }}>
      <span style={{ filter: "brightness(0)" }}>✨</span>
    </div>
  );
}
