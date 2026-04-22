"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { AnimateIn } from "./AnimateIn";

// ── Types ─────────────────────────────────────────────────────────────────────
export type LandingData = {
  template: string;
  business_name: string;
  tagline: string | null;
  description: string | null;
  whatsapp: string | null;
  address: string | null;
  schedule: string | null;
  hero_color: string;
  photo_url_1: string | null;
  photo_url_2: string | null;
  photo_url_3: string | null;
  photo_url_4: string | null;
  photo_url_5: string | null;
  photo_url_6: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  show_booking_button: boolean;
  custom_cta_text: string;
  owner_name: string | null;
  owner_bio: string | null;
  owner_photo_url: string | null;
  owner_video_url: string | null;
  diploma_urls: string[] | null;
  stats_years: number | null;
  stats_clients: number | null;
};

export type ServiceItem = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  description: string | null;
};

// ── Vertical meta ─────────────────────────────────────────────────────────────
const TEMPLATE_META: Record<string, {
  emoji: string;
  badge: string;
  ownerTitle: string;
  ctaLine: string;
  faq: { q: string; a: string }[];
}> = {
  nail_studio: {
    emoji: "💅",
    badge: "Nail Studio",
    ownerTitle: "Especialista en uñas",
    ctaLine: "¿Lista para tus uñas de ensueño?",
    faq: [
      { q: "¿Con cuánto tiempo debo reservar?", a: "Recomendamos reservar con al menos 24 horas de anticipación para garantizar tu horario favorito." },
      { q: "¿Cuánto dura el servicio?", a: "Depende del diseño. Los servicios básicos toman 45–60 min. Los diseños elaborados pueden tomar hasta 2 horas." },
      { q: "¿Puedo traer mis propias referencias?", a: "¡Claro! Puedes enviarlas por WhatsApp antes de tu cita o mostrárnoslas el día de tu visita." },
      { q: "¿Cómo cancelo o reprogramo?", a: "Escríbenos por WhatsApp con al menos 12 horas de anticipación y con gusto buscamos otro horario para ti." },
    ],
  },
  barbershop: {
    emoji: "✂️",
    badge: "Barbería",
    ownerTitle: "Barbero",
    ctaLine: "¿Listo para un corte que te defina?",
    faq: [
      { q: "¿Necesito reservar o acepto walk-ins?", a: "Recomendamos reservar para garantizar tu turno. Aceptamos walk-ins sujetos a disponibilidad." },
      { q: "¿Qué incluye el servicio de barba?", a: "Incluye recorte, perfilado, toalla caliente y productos hidratantes post-servicio." },
      { q: "¿Tienen estacionamiento?", a: "Sí, hay parqueo disponible justo frente al local sin costo adicional." },
      { q: "¿Atienden niños?", a: "¡Por supuesto! Contamos con servicio especial para los más pequeños." },
    ],
  },
  spa: {
    emoji: "✨",
    badge: "Spa & Estética",
    ownerTitle: "Especialista en estética",
    ctaLine: "Tu piel y tu cuerpo merecen lo mejor.",
    faq: [
      { q: "¿Con cuánto tiempo debo reservar?", a: "Recomendamos reservar con al menos 24 horas de anticipación para asegurarte el horario que prefieres." },
      { q: "¿Los tratamientos faciales tienen contraindicaciones?", a: "Algunos tratamientos requieren que nos avises si tienes piel sensible, acné activo o usas retinol. Indícalo al reservar." },
      { q: "¿La depilación duele mucho?", a: "Usamos técnicas y productos que minimizan el dolor. Los resultados son duraderos y la piel queda suave desde la primera sesión." },
      { q: "¿Cómo cancelo o reprogramo?", a: "Escríbenos por WhatsApp con al menos 12 horas de anticipación y con gusto encontramos otro horario para ti." },
    ],
  },
  salon: {
    emoji: "💇",
    badge: "Salón de Belleza",
    ownerTitle: "Estilista",
    ctaLine: "Tu mejor versión te está esperando.",
    faq: [
      { q: "¿Hacen consulta de color gratis?", a: "Sí, ofrecemos una consulta inicial gratuita para entender exactamente el resultado que deseas antes de aplicar cualquier color." },
      { q: "¿Usan productos sin amoniaco?", a: "Contamos con líneas de coloración sin amoniaco y alternativas naturales. Cuéntanos tus preferencias al reservar." },
      { q: "¿Qué pasa si no me gusta el resultado?", a: "Tu satisfacción es nuestra prioridad. Contáctanos dentro de los 7 días y hacemos los ajustes necesarios sin costo." },
      { q: "¿Aceptan grupos para eventos?", a: "¡Sí! Hacemos paquetes para bodas, quinceañeras y eventos especiales. Escríbenos para cotizar." },
    ],
  },
  clinica: {
    emoji: "🏥",
    badge: "Clínica",
    ownerTitle: "Especialista",
    ctaLine: "Tu salud es nuestra prioridad.",
    faq: [
      { q: "¿Necesito traer mis exámenes previos?", a: "Si tienes exámenes recientes (menos de 6 meses), tráelos para que el especialista los evalúe junto contigo." },
      { q: "¿Aceptan seguro médico?", a: "Trabajamos con los principales seguros del país. Contáctanos para verificar la cobertura de tu plan." },
      { q: "¿Cuánto dura la consulta?", a: "La primera consulta toma entre 30 y 45 minutos. Las consultas de seguimiento generalmente 15–20 minutos." },
      { q: "¿Puedo cancelar mi cita?", a: "Sí, con al menos 24 horas de anticipación. Llámanos o escríbenos por WhatsApp." },
    ],
  },
};

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, active: boolean, duration = 1500) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || target === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const pct = Math.min((now - start) / duration, 1);
      setVal(Math.round(pct * pct * target));
      if (pct < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return val;
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ years, clients, services }: { years: number; clients: number; services: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const y = useCountUp(years, active);
  const c = useCountUp(clients, active);
  const s = useCountUp(services, active);
  const items = [
    ...(years   ? [{ val: `${y}+`, lbl: "Años de experiencia" }] : []),
    ...(clients ? [{ val: `${c}+`, lbl: "Clientes atendidos" }] : []),
    ...(services? [{ val: `${s}`,  lbl: "Servicios disponibles" }] : []),
  ];
  if (!items.length) return null;
  return (
    <div ref={ref} className="border-y border-white/[0.06] bg-zinc-900/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl divide-x divide-white/[0.06]">
        {items.map((it) => (
          <div key={it.lbl} className="flex flex-1 flex-col items-center gap-0.5 py-6 px-4 text-center">
            <span className="font-future text-3xl font-bold" style={{ color: "var(--hero-hex)" }}>{it.val}</span>
            <span className="text-xs uppercase tracking-widest text-zinc-500">{it.lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Service card (3D tilt) ────────────────────────────────────────────────────
function ServiceCard({ svc, bookingUrl }: { svc: ServiceItem; bookingUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 14;
    const y = ((e.clientY - top) / height - 0.5) * -14;
    el.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02)`;
  }, []);
  const handleLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "perspective(600px) rotateX(0) rotateY(0) scale(1)";
  }, []);

  const hours = Math.floor(svc.duration_minutes / 60);
  const mins  = svc.duration_minutes % 60;
  const durLabel = hours > 0
    ? mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
    : `${mins}min`;

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-zinc-900 p-5 transition-all duration-200 will-change-transform"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at 50% 0%, rgb(var(--hero) / 0.12), transparent 70%)" }} />

      <div className="relative z-10 flex flex-1 flex-col">
        <h3 className="text-base font-semibold text-white">{svc.name}</h3>
        {svc.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-400">{svc.description}</p>
        )}
        <div className="mt-auto pt-4 flex items-end justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            {svc.price !== null && (
              <span className="text-xl font-bold" style={{ color: "var(--hero-hex)" }}>
                RD${svc.price.toLocaleString("es-DO")}
              </span>
            )}
            <span className="text-xs text-zinc-500">⏱ {durLabel}</span>
          </div>
          <Link
            href={`${bookingUrl}?service=${svc.id}`}
            className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            style={{ backgroundColor: "var(--hero-hex)", boxShadow: "0 4px 16px rgb(var(--hero) / 0.35)" }}
          >
            Reservar
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Gallery lightbox ──────────────────────────────────────────────────────────
function Gallery({ photos }: { photos: string[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight" && open !== null) setOpen((open + 1) % photos.length);
      if (e.key === "ArrowLeft" && open !== null) setOpen((open - 1 + photos.length) % photos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  return (
    <>
      <div className={`grid gap-3 ${photos.length === 1 ? "" : photos.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
        {photos.map((url, i) => (
          <AnimateIn key={i} delay={i * 60}>
            <button
              onClick={() => setOpen(i)}
              className={`group w-full overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 ${
                i === 0 && photos.length >= 4 ? "col-span-2 aspect-video md:col-span-1 md:aspect-square" : "aspect-square"
              }`}
            >
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
                loading="lazy"
              />
            </button>
          </AnimateIn>
        ))}
      </div>

      {/* Lightbox */}
      {open !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <button
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            onClick={() => setOpen(null)}
          >
            ✕
          </button>
          {photos.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:left-4"
                onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + photos.length) % photos.length); }}
              >‹</button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:right-4"
                onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % photos.length); }}
              >›</button>
            </>
          )}
          <img
            src={photos[open]}
            alt={`Foto ${open + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-sm text-zinc-500">{open + 1} / {photos.length}</p>
        </div>
      )}
    </>
  );
}

// ── FAQ accordion ─────────────────────────────────────────────────────────────
function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="divide-y divide-white/[0.06]">
      {items.map((item, i) => (
        <div key={i}>
          <button
            className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-white transition hover:text-zinc-200"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <span>{item.q}</span>
            <span
              className="ml-4 flex-shrink-0 text-lg transition-transform duration-200"
              style={{ transform: openIdx === i ? "rotate(45deg)" : "rotate(0deg)", color: "var(--hero-hex)" }}
            >+</span>
          </button>
          {openIdx === i && (
            <p className="pb-4 text-sm leading-relaxed text-zinc-400">{item.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Back to top ───────────────────────────────────────────────────────────────
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      aria-label="Volver arriba"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-24 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-lg transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, rgb(var(--hero) / 0.9), rgb(var(--hero) / 0.6))",
        boxShadow: "0 4px 20px rgb(var(--hero) / 0.45)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.8)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      💅
    </button>
  );
}

// ── Mesh gradient hero background ─────────────────────────────────────────────
function MeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="absolute inset-0 bg-zinc-950/70" />
    </div>
  );
}

// ── SVGs ─────────────────────────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── YouTube embed helper ──────────────────────────────────────────────────────
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/);
  return m?.[1] ?? null;
}

// ── Main component ────────────────────────────────────────────────────────────
export function LandingPage({
  landing,
  bookingUrl,
  services = [],
  isOpenNow = null,
  fomoLastMinutes = null,
  fomoWeekCount = 0,
}: {
  landing: LandingData;
  bookingUrl: string;
  services?: ServiceItem[];
  isOpenNow?: boolean | null;
  fomoLastMinutes?: number | null;
  fomoWeekCount?: number;
}) {
  const meta = TEMPLATE_META[landing.template] ?? TEMPLATE_META.nail_studio;
  const waNumber = landing.whatsapp?.replace(/\D/g, "") ?? "";
  const waLink = waNumber ? `https://wa.me/${waNumber}` : null;
  const photos = [
    landing.photo_url_1, landing.photo_url_2, landing.photo_url_3,
    landing.photo_url_4, landing.photo_url_5, landing.photo_url_6,
  ].filter(Boolean) as string[];
  const diplomas = (landing.diploma_urls ?? []).filter(Boolean);
  const vidId = landing.owner_video_url ? youtubeId(landing.owner_video_url) : null;
  const hasOwner = !!(landing.owner_name || landing.owner_photo_url || landing.owner_bio);
  const hasDiplomas = diplomas.length > 0;
  const hasStats = !!(landing.stats_years || landing.stats_clients || services.length);
  const hasServices = services.length > 0;

  const fomoLabel = fomoLastMinutes !== null
    ? fomoLastMinutes < 2
      ? "Reserva hace instantes"
      : fomoLastMinutes < 60
        ? `Última reserva hace ${fomoLastMinutes} min`
        : fomoLastMinutes < 1440
          ? `Última reserva hace ${Math.floor(fomoLastMinutes / 60)}h`
          : null
    : null;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-zinc-950 text-white">

      {/* ── Back to top ───────────────────────────────────────────────── */}
      <BackToTop />

      {/* ── Floating WhatsApp ──────────────────────────────────────────── */}
      {waLink && (
        <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-[0_4px_24px_rgba(16,185,129,0.5)] transition hover:scale-105 hover:bg-emerald-400">
          <WhatsAppIcon className="h-7 w-7 text-white" />
        </a>
      )}

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
        {/* Background */}
        {landing.photo_url_1 ? (
          <>
            <img src={landing.photo_url_1} alt="" className="absolute inset-0 h-full w-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/75" />
          </>
        ) : (
          <>
            <MeshGradient />
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 80% at 50% -20%, rgb(var(--hero) / 0.3) 0%, transparent 60%)` }} />
          </>
        )}
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-xl" style={{ animation: "heroFadeIn 0.9s ease both" }}>
          {/* Open/Closed + vertical badge row */}
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
            {isOpenNow !== null && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                isOpenNow
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/40 bg-red-500/10 text-red-400"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isOpenNow ? "animate-pulse bg-emerald-400" : "bg-red-400"}`} />
                {isOpenNow ? "Abierto ahora" : "Cerrado ahora"}
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ borderColor: "rgb(var(--hero) / 0.5)", backgroundColor: "rgb(var(--hero) / 0.12)", color: "white" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--hero-hex)" }} />
              {meta.emoji} {meta.badge}
            </span>
          </div>

          <h1 className="font-future text-5xl font-bold leading-[1.05] text-white drop-shadow-xl sm:text-6xl md:text-7xl">
            {landing.business_name}
          </h1>

          {landing.tagline && (
            <p className="mt-5 text-xl leading-relaxed text-white/75">{landing.tagline}</p>
          )}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {landing.show_booking_button && (
              <Link href={bookingUrl}
                className="inline-flex w-full min-w-[200px] items-center justify-center rounded-2xl px-7 py-3.5 text-base font-bold text-white shadow-lg transition hover:brightness-110 sm:w-auto"
                style={{ backgroundColor: "var(--hero-hex)", boxShadow: "0 8px 32px rgb(var(--hero) / 0.4)" }}>
                {landing.custom_cta_text}
              </Link>
            )}
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex w-full min-w-[200px] items-center justify-center gap-2 rounded-2xl bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto">
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp
              </a>
            )}
          </div>

          {/* FOMO indicators */}
          {(fomoLabel || fomoWeekCount > 0) && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {fomoWeekCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1 text-xs text-zinc-300 backdrop-blur-sm">
                  <span className="text-base">🔥</span>
                  <strong style={{ color: "var(--hero-hex)" }}>{fomoWeekCount}</strong> reservas esta semana
                </span>
              )}
              {fomoLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1 text-xs text-zinc-300 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  {fomoLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-40">
          <div className="mx-auto h-8 w-5 rounded-full border border-white/40 p-1">
            <div className="mx-auto h-1.5 w-1 animate-bounce rounded-full bg-white" />
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      {hasStats && (
        <StatsBar
          years={landing.stats_years ?? 0}
          clients={landing.stats_clients ?? 0}
          services={services.length}
        />
      )}

      {/* ── SERVICIOS ─────────────────────────────────────────────────── */}
      {hasServices && (
        <section className="border-t border-white/[0.06] bg-zinc-950 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <AnimateIn>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--hero-hex)" }}>
                Servicios
              </p>
              <h2 className="mb-8 text-3xl font-bold text-white">¿Qué deseas hoy?</h2>
            </AnimateIn>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((svc, i) => (
                <AnimateIn key={svc.id} delay={i * 60}>
                  <ServiceCard svc={svc} bookingUrl={bookingUrl} />
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SOBRE NOSOTROS ────────────────────────────────────────────── */}
      {landing.description && (
        <section className="border-t border-white/[0.06] bg-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-2xl">
            <AnimateIn>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--hero-hex)" }}>
                Sobre nosotros
              </p>
              <h2 className="mb-6 text-3xl font-bold text-white">Quiénes somos</h2>
              <p className="text-base leading-relaxed text-zinc-300">{landing.description}</p>
            </AnimateIn>

            {(landing.address || landing.schedule) && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {landing.address && (
                  <AnimateIn delay={100}>
                    <div className="rounded-xl border p-4" style={{ borderColor: "rgb(var(--hero) / 0.25)", backgroundColor: "rgb(var(--hero) / 0.07)" }}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">📍 Dirección</p>
                      <p className="text-sm text-zinc-200">{landing.address}</p>
                    </div>
                  </AnimateIn>
                )}
                {landing.schedule && (
                  <AnimateIn delay={150}>
                    <div className="rounded-xl border p-4" style={{ borderColor: "rgb(var(--hero) / 0.25)", backgroundColor: "rgb(var(--hero) / 0.07)" }}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">🕐 Horario</p>
                      <p className="text-sm text-zinc-200">{landing.schedule}</p>
                    </div>
                  </AnimateIn>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── GALERÍA ───────────────────────────────────────────────────── */}
      {photos.length > 0 && (
        <section className="border-t border-white/[0.06] bg-zinc-950 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <AnimateIn>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--hero-hex)" }}>
                📸 Galería
              </p>
              <h2 className="mb-8 text-3xl font-bold text-white">Nuestro trabajo</h2>
            </AnimateIn>
            <Gallery photos={photos} />
          </div>
        </section>
      )}

      {/* ── DUEÑO / EQUIPO ────────────────────────────────────────────── */}
      {hasOwner && (
        <section className="border-t border-white/[0.06] bg-zinc-900 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <AnimateIn>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--hero-hex)" }}>
                El equipo
              </p>
              <h2 className="mb-10 text-3xl font-bold text-white">
                Conoce a {landing.owner_name ?? "nuestra especialista"}
              </h2>
            </AnimateIn>

            <div className={`grid gap-10 ${vidId ? "lg:grid-cols-2" : "sm:grid-cols-[auto_1fr]"} items-start`}>
              <AnimateIn delay={80} className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6 lg:flex-col lg:items-center">
                {landing.owner_photo_url ? (
                  <div className="h-40 w-40 flex-shrink-0 overflow-hidden rounded-full"
                    style={{ boxShadow: `0 0 0 4px var(--hero-hex)` }}>
                    <img src={landing.owner_photo_url} alt={landing.owner_name ?? "Dueña"} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex h-40 w-40 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-6xl">
                    {meta.emoji}
                  </div>
                )}
                <div className={vidId ? "text-center lg:text-center" : "sm:text-left"}>
                  {landing.owner_name && <p className="text-xl font-bold text-white">{landing.owner_name}</p>}
                  <p className="text-sm" style={{ color: "var(--hero-hex)" }}>{meta.ownerTitle}</p>
                  {landing.owner_bio && !vidId && (
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">{landing.owner_bio}</p>
                  )}
                </div>
              </AnimateIn>

              <AnimateIn delay={160}>
                {landing.owner_bio && (
                  <p className="mb-6 text-base leading-relaxed text-zinc-300">{landing.owner_bio}</p>
                )}
                {vidId && (
                  <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: "16/9" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${vidId}?rel=0&modestbranding=1`}
                      title="Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                )}
              </AnimateIn>
            </div>
          </div>
        </section>
      )}

      {/* ── DIPLOMAS / CERTIFICACIONES ────────────────────────────────── */}
      {hasDiplomas && (
        <section className="border-t border-white/[0.06] bg-zinc-950 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <AnimateIn>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--hero-hex)" }}>
                🎓 Certificaciones
              </p>
              <h2 className="mb-8 text-3xl font-bold text-white">Formación y logros</h2>
            </AnimateIn>
            <div className={`grid gap-4 ${diplomas.length === 1 ? "max-w-sm" : diplomas.length === 2 ? "grid-cols-2 max-w-lg" : "grid-cols-2 sm:grid-cols-3"}`}>
              {diplomas.map((url, i) => (
                <AnimateIn key={i} delay={i * 80}>
                  <div className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900">
                    <img src={url} alt={`Certificación ${i + 1}`} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" style={{ maxHeight: 280 }} loading="lazy" />
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] bg-zinc-900 px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <AnimateIn>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--hero-hex)" }}>
              Preguntas frecuentes
            </p>
            <h2 className="mb-8 text-3xl font-bold text-white">¿Tienes dudas?</h2>
          </AnimateIn>
          <AnimateIn delay={80}>
            <FaqAccordion items={meta.faq} />
          </AnimateIn>
        </div>
      </section>

      {/* ── REDES SOCIALES ────────────────────────────────────────────── */}
      {(landing.instagram_url || landing.tiktok_url || landing.facebook_url) && (
        <section className="border-t border-white/[0.06] bg-zinc-950 px-6 py-12">
          <div className="mx-auto max-w-lg text-center">
            <AnimateIn>
              <p className="mb-5 text-sm uppercase tracking-widest text-zinc-500">Síguenos</p>
              <div className="flex items-center justify-center gap-4">
                {landing.instagram_url && (
                  <a href={landing.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-zinc-800 transition hover:border-pink-500/40 hover:bg-pink-500/10 hover:text-pink-400">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {landing.tiktok_url && (
                  <a href={landing.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-zinc-800 text-zinc-300 transition hover:border-white/20 hover:bg-zinc-700">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.75a4.85 4.85 0 01-1.02-.06z"/>
                    </svg>
                  </a>
                )}
                {landing.facebook_url && (
                  <a href={landing.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-zinc-800 text-zinc-300 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
              </div>
            </AnimateIn>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 text-center" style={{
        background: `linear-gradient(135deg, rgb(var(--hero) / 0.2) 0%, rgb(var(--hero) / 0.05) 60%, transparent 100%)`,
        borderTop: "1px solid rgb(var(--hero) / 0.2)",
      }}>
        <AnimateIn>
          <div className="mx-auto max-w-lg">
            <p className="mb-3 text-5xl">{meta.emoji}</p>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">{meta.ctaLine}</h2>
            <p className="mb-8 text-zinc-400">Reserva en línea en menos de 2 minutos.</p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {landing.show_booking_button && (
                <Link href={bookingUrl}
                  className="inline-flex w-full min-w-[200px] items-center justify-center rounded-2xl px-8 py-4 text-base font-bold text-white shadow-lg transition hover:brightness-110 sm:w-auto"
                  style={{ backgroundColor: "var(--hero-hex)", boxShadow: "0 8px 32px rgb(var(--hero) / 0.45)" }}>
                  {landing.custom_cta_text}
                </Link>
              )}
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex w-full min-w-[200px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-emerald-500 sm:w-auto">
                  <WhatsAppIcon className="h-5 w-5" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-zinc-950 px-6 py-10 text-center">
        <p className="font-future text-lg font-semibold text-white">{landing.business_name}</p>
        <p className="mt-2 text-xs text-zinc-600">
          Powered by{" "}
          <a href="https://bookido.online" target="_blank" rel="noopener noreferrer" className="transition hover:text-zinc-400">
            Bookido
          </a>
        </p>
      </footer>

      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.25;
          background: var(--hero-hex, #ec4899);
        }
        .blob-1 {
          width: 500px; height: 500px;
          top: -100px; left: -100px;
          animation: blobMove1 12s ease-in-out infinite alternate;
        }
        .blob-2 {
          width: 400px; height: 400px;
          bottom: -80px; right: -80px;
          opacity: 0.18;
          animation: blobMove2 14s ease-in-out infinite alternate;
        }
        .blob-3 {
          width: 300px; height: 300px;
          top: 40%; left: 50%;
          transform: translateX(-50%);
          opacity: 0.12;
          animation: blobMove3 10s ease-in-out infinite alternate;
        }
        @keyframes blobMove1 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(60px, 40px) scale(1.15); }
        }
        @keyframes blobMove2 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-50px, -30px) scale(1.1); }
        }
        @keyframes blobMove3 {
          from { transform: translateX(-50%) scale(1); }
          to   { transform: translateX(-40%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}
