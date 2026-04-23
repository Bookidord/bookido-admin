"use client";

import { useState, useMemo } from "react";
import { sendCampaignAction } from "@/app/panel/campanas/actions";

type Client = {
  name: string;
  email: string;
  phone: string | null;
  total: number;
};

type Filter = "all" | "vip" | "regular" | "new";
type Channel = "email" | "whatsapp";

const FILTER_OPTS: { value: Filter; label: string; desc: string }[] = [
  { value: "all",     label: "Todos",    desc: "Todos los clientes" },
  { value: "vip",     label: "VIP ⭐",   desc: "10 o más reservas" },
  { value: "regular", label: "Regulares", desc: "4 a 9 reservas" },
  { value: "new",     label: "Nuevos",   desc: "Menos de 4 reservas" },
];

function clientTier(total: number): Filter {
  if (total >= 10) return "vip";
  if (total >= 4) return "regular";
  return "new";
}

export function CampanaForm({ clients, tenantSlug }: { clients: Client[]; tenantSlug: string }) {
  const [channel, setChannel] = useState<Channel>("email");
  const [filter, setFilter] = useState<Filter>("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [result, setResult] = useState<{ sent?: number; error?: string }>({});
  const [showWaPanel, setShowWaPanel] = useState(false);
  const [copied, setCopied] = useState<"numbers" | "message" | null>(null);

  const recipients = useMemo(
    () => clients.filter((c) => filter === "all" || clientTier(c.total) === filter),
    [clients, filter]
  );

  const withEmail = recipients.filter((c) => c.email);
  const withPhone = recipients.filter((c) => c.phone);

  async function handleSend() {
    if (channel === "whatsapp") {
      setShowWaPanel(true);
      return;
    }
    if (!subject.trim() || !message.trim()) return;
    setState("sending");
    const res = await sendCampaignAction({ subject, message, channel, filter });
    if (res.ok) {
      setState("sent");
      setResult({ sent: res.sent });
    } else {
      setState("error");
      setResult({ error: res.error });
    }
  }

  function copyText(text: string, type: "numbers" | "message") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const waMessage = message.trim();
  const phoneList = withPhone.map((c) => (c.phone ?? "").replace(/\D/g, "")).filter(Boolean).join("\n");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Form */}
      <div className="lg:col-span-2 space-y-5">
        {/* Channel toggle */}
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Canal de envío</p>
          <div className="flex gap-2">
            {(["email", "whatsapp"] as Channel[]).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => { setChannel(ch); setShowWaPanel(false); setState("idle"); }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  channel === ch
                    ? ch === "email"
                      ? "border-indigo-400/30 bg-indigo-500/10 text-indigo-300"
                      : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : "border-white/[0.07] text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {ch === "email" ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                )}
                {ch === "email" ? "Email" : "WhatsApp"}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Mensaje</p>

          {channel === "email" && (
            <div>
              <label className="mb-1.5 block text-xs text-zinc-400">Asunto</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: ¡Promoción especial este mes!"
                className="w-full rounded-xl border border-white/[0.07] bg-ink-950/60 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-[#14F195]/30 focus:ring-1 focus:ring-[#14F195]/20"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">
              Mensaje
              <span className="ml-2 text-zinc-600">— usa <code className="text-[#14F195]/70">{"{{nombre}}"}</code> para personalizar</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={"Hola {{nombre}}, tenemos una promoción especial para ti esta semana. ¡Reserva tu turno antes de que se agoten los espacios!"}
              rows={5}
              className="w-full rounded-xl border border-white/[0.07] bg-ink-950/60 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-none focus:border-[#14F195]/30 focus:ring-1 focus:ring-[#14F195]/20"
            />
            {message && (
              <p className="mt-1.5 text-xs text-zinc-600">
                Preview: <span className="text-zinc-400">{message.replace(/\{\{nombre\}\}/g, "María")}</span>
              </p>
            )}
          </div>
        </div>

        {/* Send button */}
        {!showWaPanel && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSend}
              disabled={state === "sending" || (channel === "email" && (!subject.trim() || !message.trim())) || recipients.length === 0}
              className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${
                channel === "email"
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "bg-emerald-600 text-white hover:bg-emerald-500"
              }`}
            >
              {state === "sending" ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Enviando…
                </>
              ) : channel === "email" ? (
                `Enviar a ${withEmail.length} cliente${withEmail.length !== 1 ? "s" : ""}`
              ) : (
                `Ver números para WhatsApp`
              )}
            </button>

            {state === "sent" && (
              <p className="text-sm text-emerald-400">✓ Enviado a {result.sent} cliente{result.sent !== 1 ? "s" : ""}</p>
            )}
            {state === "error" && (
              <p className="text-sm text-red-400">✕ {result.error}</p>
            )}
          </div>
        )}

        {/* WhatsApp panel */}
        {showWaPanel && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.05] p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Envío por WhatsApp</p>
                <p className="mt-0.5 text-xs text-zinc-500">{withPhone.length} cliente{withPhone.length !== 1 ? "s" : ""} con teléfono registrado</p>
              </div>
              <button onClick={() => setShowWaPanel(false)} className="text-zinc-600 hover:text-zinc-300 transition text-lg leading-none">×</button>
            </div>

            <div className="space-y-3">
              {/* Copy message */}
              <div>
                <p className="mb-1.5 text-xs text-zinc-500">1. Copia el mensaje</p>
                <div className="flex items-start gap-2">
                  <div className="flex-1 rounded-lg border border-white/[0.06] bg-ink-950/60 px-3 py-2.5 text-xs text-zinc-300 whitespace-pre-wrap max-h-28 overflow-y-auto">
                    {waMessage || <span className="text-zinc-600 italic">Escribe un mensaje primero</span>}
                  </div>
                  <button
                    onClick={() => copyText(waMessage, "message")}
                    disabled={!waMessage}
                    className="shrink-0 rounded-lg border border-white/[0.07] px-3 py-2 text-xs text-zinc-400 transition hover:text-white disabled:opacity-40"
                  >
                    {copied === "message" ? "✓" : "Copiar"}
                  </button>
                </div>
              </div>

              {/* Copy numbers */}
              <div>
                <p className="mb-1.5 text-xs text-zinc-500">2. Copia los números para tu lista de difusión</p>
                <div className="flex items-start gap-2">
                  <div className="flex-1 rounded-lg border border-white/[0.06] bg-ink-950/60 px-3 py-2.5 text-xs text-zinc-300 font-mono max-h-28 overflow-y-auto whitespace-pre">
                    {phoneList || <span className="text-zinc-600 italic">Sin teléfonos</span>}
                  </div>
                  <button
                    onClick={() => copyText(phoneList, "numbers")}
                    disabled={!phoneList}
                    className="shrink-0 rounded-lg border border-white/[0.07] px-3 py-2 text-xs text-zinc-400 transition hover:text-white disabled:opacity-40"
                  >
                    {copied === "numbers" ? "✓" : "Copiar"}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-xs text-zinc-500 leading-relaxed">
                <strong className="text-zinc-400">Cómo usar:</strong> En WhatsApp → Listas de difusión → Nueva lista → pega los números → envía el mensaje. Solo lo reciben quienes te tienen guardado en sus contactos.
              </div>

              {/* Individual WA links */}
              {withPhone.length <= 20 && withPhone.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-zinc-500">O envía uno por uno:</p>
                  <div className="flex flex-wrap gap-2">
                    {withPhone.map((c) => (
                      <a
                        key={c.email}
                        href={`https://wa.me/${(c.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(waMessage.replace(/\{\{nombre\}\}/g, c.name.split(" ")[0]))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/15"
                      >
                        {c.name.split(" ")[0]}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar: filter + recipient list */}
      <div className="space-y-4">
        {/* Filter */}
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Destinatarios</p>
          <div className="space-y-1.5">
            {FILTER_OPTS.map((f) => {
              const count = clients.filter((c) => f.value === "all" || clientTier(c.total) === f.value).length;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    filter === f.value
                      ? "bg-[#14F195]/10 text-white ring-1 ring-[#14F195]/20"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  <div>
                    <span className="font-medium">{f.label}</span>
                    <span className="ml-2 text-xs text-zinc-600">{f.desc}</span>
                  </div>
                  <span className={`text-xs font-mono font-semibold ${filter === f.value ? "text-[#14F195]" : "text-zinc-600"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipient preview */}
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/40">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="text-xs font-medium text-zinc-400">
              {recipients.length} destinatario{recipients.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
            {recipients.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-zinc-600">Sin clientes en este segmento.</p>
            ) : (
              recipients.slice(0, 30).map((c) => (
                <div key={c.email} className="flex items-center gap-2.5 px-4 py-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-xs font-semibold text-zinc-300">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-200">{c.name}</p>
                    <p className="truncate text-[10px] text-zinc-600">{c.email}</p>
                  </div>
                </div>
              ))
            )}
            {recipients.length > 30 && (
              <p className="px-4 py-2 text-center text-[10px] text-zinc-600">+{recipients.length - 30} más</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
