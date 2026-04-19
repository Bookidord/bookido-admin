import Link from "next/link";

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
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  show_booking_button: boolean;
  custom_cta_text: string;
};

const TEMPLATE_META: Record<string, { emoji: string; badge: string; aboutIcon: string }> = {
  nail_studio: { emoji: "💅", badge: "Nail Studio",       aboutIcon: "✨" },
  barbershop:  { emoji: "✂️", badge: "Barbería",          aboutIcon: "🪒" },
  spa:         { emoji: "🧖", badge: "Spa & Bienestar",   aboutIcon: "🌿" },
  salon:       { emoji: "💇", badge: "Salón de Belleza",  aboutIcon: "💫" },
  restaurant:  { emoji: "🍽️", badge: "Restaurante",       aboutIcon: "⭐" },
};

// ── WhatsApp SVG ──────────────────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function LandingPage({
  landing,
  bookingUrl,
}: {
  landing: LandingData;
  bookingUrl: string;
}) {
  // NOTE: color values come from CSS vars injected by the parent page:
  //   --hero-hex   → solid color (e.g. #be185d)
  //   --hero       → R G B parts  (e.g. 190 24 93)
  // Usage: rgb(var(--hero) / 0.25)  |  var(--hero-hex)
  const meta    = TEMPLATE_META[landing.template] ?? TEMPLATE_META.nail_studio;
  const waNumber = landing.whatsapp?.replace(/\D/g, "") ?? "";
  const waLink   = waNumber ? `https://wa.me/${waNumber}` : null;

  const photos = [landing.photo_url_1, landing.photo_url_2, landing.photo_url_3].filter(Boolean) as string[];
  const hasSocial        = !!(landing.instagram_url || landing.tiktok_url || landing.facebook_url);
  const hasAboutContent  = !!(landing.description || landing.address || landing.schedule || hasSocial);

  return (
    <div className="min-h-dvh bg-zinc-950 text-white">

      {/* ── Floating WhatsApp ─────────────────────────────────────── */}
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-[0_4px_24px_rgba(16,185,129,0.5)] transition hover:bg-emerald-400 hover:scale-105"
        >
          <WhatsAppIcon className="h-7 w-7 text-white" />
        </a>
      )}

      {/* ── SECTION 1: Hero ────────────────────────────────────────── */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
        {/* Background: photo or gradient */}
        {landing.photo_url_1 ? (
          <img
            src={landing.photo_url_1}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgb(var(--hero) / 0.6) 0%, #09090b 70%)`,
            }}
          />
        )}
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{ background: landing.photo_url_1 ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)" }}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-lg">
          <span
            className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{
              borderColor:     "rgb(var(--hero) / 0.5)",
              backgroundColor: "rgb(var(--hero) / 0.15)",
              color:           "white",
            }}
          >
            {meta.emoji} {meta.badge}
          </span>

          <h1 className="font-future text-4xl font-bold leading-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl">
            {landing.business_name}
          </h1>

          {landing.tagline && (
            <p className="mt-4 text-lg leading-relaxed text-white/80 sm:text-xl">
              {landing.tagline}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {landing.show_booking_button && (
              <Link
                href={bookingUrl}
                className="inline-flex w-full min-w-[200px] items-center justify-center rounded-2xl px-7 py-3.5 text-base font-bold text-white shadow-lg transition hover:brightness-110 sm:w-auto"
                style={{ backgroundColor: "var(--hero-hex)" }}
              >
                {landing.custom_cta_text}
              </Link>
            )}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full min-w-[200px] items-center justify-center gap-2 rounded-2xl bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto"
              >
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-50">
          <div className="mx-auto h-8 w-5 rounded-full border border-white/40 p-1">
            <div className="mx-auto h-1.5 w-1 animate-bounce rounded-full bg-white" />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Sobre nosotros ─────────────────────────────── */}
      {hasAboutContent && (
        <section className="border-t border-white/[0.06] bg-zinc-900 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--hero-hex)" }}
            >
              {meta.aboutIcon} Sobre nosotros
            </p>
            <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
              Quiénes somos
            </h2>

            {landing.description && (
              <p className="mb-8 text-base leading-relaxed text-zinc-300">
                {landing.description}
              </p>
            )}

            {(landing.address || landing.schedule) && (
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                {landing.address && (
                  <div
                    className="rounded-xl border p-4"
                    style={{
                      borderColor:     "rgb(var(--hero) / 0.25)",
                      backgroundColor: "rgb(var(--hero) / 0.07)",
                    }}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      📍 Dirección
                    </p>
                    <p className="text-sm text-zinc-200">{landing.address}</p>
                  </div>
                )}
                {landing.schedule && (
                  <div
                    className="rounded-xl border p-4"
                    style={{
                      borderColor:     "rgb(var(--hero) / 0.25)",
                      backgroundColor: "rgb(var(--hero) / 0.07)",
                    }}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      🕐 Horario
                    </p>
                    <p className="text-sm text-zinc-200">{landing.schedule}</p>
                  </div>
                )}
              </div>
            )}

            {hasSocial && (
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-zinc-600">Síguenos</span>
                {landing.instagram_url && (
                  <a
                    href={landing.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 transition hover:bg-white/15"
                  >
                    <svg className="h-4 w-4 text-zinc-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {landing.tiktok_url && (
                  <a
                    href={landing.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 transition hover:bg-white/15"
                  >
                    <svg className="h-4 w-4 text-zinc-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.75a4.85 4.85 0 01-1.02-.06z"/>
                    </svg>
                  </a>
                )}
                {landing.facebook_url && (
                  <a
                    href={landing.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 transition hover:bg-white/15"
                  >
                    <svg className="h-4 w-4 text-zinc-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SECTION 3: Galería ────────────────────────────────────── */}
      {photos.length > 0 && (
        <section className="border-t border-white/[0.06] bg-zinc-950 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--hero-hex)" }}
            >
              📸 Galería
            </p>
            <h2 className="mb-8 text-2xl font-bold text-white sm:text-3xl">
              Nuestro trabajo
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
              {photos.map((url, i) => (
                <div
                  key={i}
                  className="aspect-square min-w-[72vw] flex-shrink-0 overflow-hidden rounded-2xl sm:min-w-0"
                >
                  <img
                    src={url}
                    alt={`Galería ${i + 1}`}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 4: Reservar CTA ──────────────────────────────── */}
      <section
        className="px-6 py-20 text-center sm:py-24"
        style={{
          backgroundColor: "rgb(var(--hero) / 0.12)",
          borderTop:       `1px solid rgb(var(--hero) / 0.2)`,
        }}
      >
        <div className="mx-auto max-w-lg">
          <p className="mb-3 text-4xl">{meta.emoji}</p>
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
            ¿Lista para tu próxima cita?
          </h2>
          <p className="mb-8 text-zinc-400">
            Reserva en línea o escríbenos por WhatsApp.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {landing.show_booking_button && (
              <Link
                href={bookingUrl}
                className="inline-flex w-full min-w-[200px] items-center justify-center rounded-2xl px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:brightness-110 sm:w-auto"
                style={{ backgroundColor: "var(--hero-hex)" }}
              >
                {landing.custom_cta_text}
              </Link>
            )}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full min-w-[200px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-emerald-500 sm:w-auto"
              >
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Footer ────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-zinc-950 px-6 py-10 text-center">
        <p className="font-future text-lg font-semibold text-white">
          {landing.business_name}
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          Powered by{" "}
          <a
            href="https://bookido.online"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 transition hover:text-zinc-300"
          >
            Bookido
          </a>
        </p>
      </footer>
    </div>
  );
}
