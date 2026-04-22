import { getISOWeek, getISOWeekYear } from "date-fns";

// ─── Greeting ─────────────────────────────────────────────────────────────────
export function getGreeting(date: Date): { text: string; emoji: string } {
  const h = parseInt(
    date.toLocaleString("es-DO", { hour: "numeric", hour12: false, timeZone: "America/Santo_Domingo" }),
    10,
  );
  if (h >= 5 && h < 12) return { text: "Buenos días", emoji: "☀️" };
  if (h >= 12 && h < 19) return { text: "Buenas tardes", emoji: "🌤️" };
  return { text: "Buenas noches", emoji: "🌙" };
}

// ─── Streak ───────────────────────────────────────────────────────────────────
export function computeStreak(starts: string[]): number {
  if (!starts.length) return 0;
  const tz = "America/Santo_Domingo";
  const toDay = (iso: string) =>
    new Date(iso).toLocaleDateString("sv-SE", { timeZone: tz }); // "YYYY-MM-DD"

  const unique = [...new Set(starts.map(toDay))].sort().reverse();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: tz });
  const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString("sv-SE", { timeZone: tz });

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 0;
  let cursor = new Date(unique[0] + "T12:00:00");
  for (const day of unique) {
    const expected = cursor.toLocaleDateString("sv-SE", { timeZone: tz });
    if (day !== expected) break;
    streak++;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

// ─── Weekly record ────────────────────────────────────────────────────────────
export function computeWeeklyRecord(starts: string[]): number {
  if (!starts.length) return 0;
  const map: Record<string, number> = {};
  for (const s of starts) {
    const d = new Date(s);
    const key = `${getISOWeekYear(d)}-${getISOWeek(d)}`;
    map[key] = (map[key] ?? 0) + 1;
  }
  return Math.max(...Object.values(map));
}

// ─── Phrases by rubro ─────────────────────────────────────────────────────────
const PHRASES: Record<string, string[]> = {
  nail_studio: [
    "Cada manicura es una obra de arte ✨",
    "Uñas perfectas, clienta feliz 💅",
    "El detalle marca la diferencia en tu arte",
    "Tu talento transforma manos en joyas 💎",
    "Hoy es un buen día para brillar más ✨",
    "La perfección está en los detalles 🌸",
    "Cada color cuenta una historia 🎨",
  ],
  salon: [
    "Un buen corte cambia el día de alguien 💇",
    "Tu creatividad es tu mejor herramienta",
    "Haz que cada clienta salga sintiéndose reina 👑",
    "El cabello es la primera moda que viste",
    "Hoy es otro día para superar expectativas 🌟",
    "Tu tijera, tu firma ✂️",
    "El arte del cabello vive en tus manos 💫",
  ],
  barbershop: [
    "Un barbero de verdad transforma más que el look ✂️",
    "El corte perfecto es arte y precisión",
    "Cada cliente sale mejor de lo que entró 💪",
    "Tu navaja, tu firma",
    "El barbero hace más que cortar — construye confianza",
    "Precisión, estilo, orgullo 🏆",
    "Tu silla, tu reino 👑",
  ],
  spa: [
    "El bienestar que das, vuelve a ti multiplicado 🧖",
    "Cuidas cuerpos, tocas almas",
    "El descanso de tus clientes empieza contigo",
    "Hoy alguien saldrá renovado gracias a ti 🌿",
    "Tu espacio es un refugio — cuídalo con orgullo",
    "La calma es el lujo más buscado 🕊️",
    "Paz y bienestar, tu producto estrella 💚",
  ],
  restaurant: [
    "Cada plato es una experiencia memorable 🍽️",
    "El sabor es el idioma universal",
    "Tu cocina, tu historia",
    "Hoy alguien recordará tu mesa con cariño",
    "La hospitalidad se nota desde el primer momento 🤝",
    "Cocinar con amor siempre se nota 🔥",
    "Tu sazón es tu marca registrada 🌶️",
  ],
  default: [
    "Cada reserva es una nueva oportunidad 🌟",
    "Tu servicio marca la diferencia en la vida de alguien",
    "Los mejores negocios se construyen reserva a reserva",
    "Hoy es otro día para superar expectativas 🚀",
    "El esfuerzo de hoy es el éxito de mañana",
    "Brindar un excelente servicio es tu superpoder 💪",
    "Pequeños detalles, grandes impresiones ✨",
  ],
};

const TIPS: string[] = [
  "💡 Pide a tus clientes que te sigan en Instagram después de cada visita.",
  "💡 Un mensaje de WhatsApp el día antes reduce las cancelaciones a la mitad.",
  "💡 Ofrecer un descuento por referido multiplica tu clientela sin gastar en ads.",
  "💡 Responder rápido a los mensajes aumenta la conversión en un 60%.",
  "💡 Añadir fotos reales de tu trabajo a la landing genera más confianza.",
  "💡 Los clientes que reservan online son 2× más puntuales.",
  "💡 Una tarjeta de fidelidad (5ta visita gratis) aumenta la retención.",
  "💡 Publica en redes martes y jueves — mayor engagement esos días.",
  "💡 Solicita reseñas en Google a tus clientes más satisfechos.",
  "💡 El horario de mayor demanda suele ser 10 AM–12 PM — no lo desperdicies.",
  "💡 Un perfil de Google Business actualizado atrae 70% más clientes locales.",
  "💡 Comparte el link de reservas en tu bio de Instagram y WhatsApp.",
  "💡 Los clientes que vuelven gastan 67% más que los nuevos — cuídalos.",
];

export function getPhraseOfDay(template: string, tenantSlug: string, date: Date): string {
  const list = PHRASES[template] ?? PHRASES.default;
  const seed =
    date.getFullYear() * 10000 +
    (date.getMonth() + 1) * 100 +
    date.getDate() +
    tenantSlug.charCodeAt(0);
  return list[seed % list.length];
}

export function getTipOfDay(date: Date): string {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return TIPS[seed % TIPS.length];
}

// ─── Badges ───────────────────────────────────────────────────────────────────
export type BadgeDef = {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  totalRequired?: number;
  streakRequired?: number;
};

export const BADGE_DEFS: BadgeDef[] = [
  { id: "first",    emoji: "🌱", label: "Primera reserva",   desc: "¡Empezaste!",              totalRequired: 1 },
  { id: "ten",      emoji: "⭐", label: "10 reservas",        desc: "Vas tomando vuelo",        totalRequired: 10 },
  { id: "fifty",    emoji: "🌟", label: "50 reservas",        desc: "Ya eres un referente",     totalRequired: 50 },
  { id: "hundred",  emoji: "💯", label: "100 reservas",       desc: "Tres dígitos, una marca",  totalRequired: 100 },
  { id: "fivehun",  emoji: "🏆", label: "500 reservas",       desc: "Negocio sólido",           totalRequired: 500 },
  { id: "streak7",  emoji: "🔥", label: "7 días seguidos",    desc: "Racha de una semana",      streakRequired: 7 },
  { id: "streak30", emoji: "⚡", label: "30 días seguidos",   desc: "Racha de un mes",          streakRequired: 30 },
];

export type BadgeState = BadgeDef & { unlocked: boolean };

export function computeBadges(
  total: number,
  streak: number,
): {
  unlocked: BadgeState[];
  nextBadge: (BadgeDef & { current: number; target: number }) | null;
} {
  const states: BadgeState[] = BADGE_DEFS.map((b) => ({
    ...b,
    unlocked:
      (b.totalRequired !== undefined && total >= b.totalRequired) ||
      (b.streakRequired !== undefined && streak >= b.streakRequired),
  }));

  const unlocked = states.filter((b) => b.unlocked);

  // Find next badge to unlock
  const next = states.find((b) => !b.unlocked);
  const nextBadge = next
    ? {
        ...next,
        current: next.totalRequired !== undefined ? total : streak,
        target: (next.totalRequired ?? next.streakRequired)!,
      }
    : null;

  return { unlocked, nextBadge };
}
