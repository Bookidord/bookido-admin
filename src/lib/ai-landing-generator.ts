import Anthropic from "@anthropic-ai/sdk";

export interface GeneratedService {
  name: string;
  duration: number;
  price: number;
  description: string;
}

export interface LandingContent {
  tagline: string;
  description: string;
  schedule: string;
  ownerSpecialty: string;
  services: GeneratedService[];
}

const VERTICAL_GUIDANCE: Record<string, string> = {
  nail_studio: `Vertical: Nail Studio / Uñas
Servicios típicos: Manicure, Pedicure, Uñas en Gel, Uñas Acrílicas, Nail Art, Esmaltado Semipermanente, Retiro de Gel
Rango de precios RD$: 700–3,000
Duración típica: 30–90 minutos
Horario sugerido: Lunes a Sábado 9AM–7PM`,

  barbershop: `Vertical: Barbería
Servicios típicos: Corte de Pelo, Barba, Fade, Diseño, Cejas, Corte + Barba combo
Rango de precios RD$: 300–1,500
Duración típica: 20–60 minutos
Horario sugerido: Lunes a Sábado 8AM–8PM`,

  spa: `Vertical: Spa / Bienestar
Servicios típicos: Masaje Relajante, Masaje Descontracturante, Facial Profundo, Exfoliación Corporal, Aromaterapia, Piedras Calientes
Rango de precios RD$: 1,500–5,000
Duración típica: 45–120 minutos
Horario sugerido: Lunes a Sábado 9AM–6PM`,

  salon: `Vertical: Salón de Belleza
Servicios típicos: Maquillaje Social, Alisado, Tinte, Mechas, Keratina, Corte de Pelo, Brushing, Tratamiento Capilar
Rango de precios RD$: 1,000–4,000
Duración típica: 30–120 minutos
Horario sugerido: Lunes a Sábado 8AM–7PM`,

  restaurant: `Vertical: Restaurante
NO generar servicios (los restaurantes no usan servicios de reserva de citas).
Genera solo tagline, description, ownerSpecialty y schedule.
Horario sugerido: Lunes a Domingo 11AM–10PM`,
};

export async function generateLandingContent(input: {
  businessName: string;
  template: string;
  instagram?: string;
  whatsapp?: string;
  slug: string;
}): Promise<LandingContent> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const verticalInfo = VERTICAL_GUIDANCE[input.template] ?? VERTICAL_GUIDANCE.salon;
  const isRestaurant = input.template === "restaurant";

  const instagramLine = input.instagram
    ? `El negocio tiene Instagram: ${input.instagram}`
    : "";

  const prompt = `Genera contenido para la landing page de un negocio dominicano llamado "${input.businessName}".

${verticalInfo}

${instagramLine}

Instrucciones:
- Escribe en español dominicano natural (no demasiado formal, pero profesional).
- REGLA ABSOLUTA: NUNCA inventes datos del negocio.
- PROHIBIDO inventar: años de experiencia, número de clientes, premios, certificaciones, fechas de fundación, cifras de cualquier tipo.
- Si la data NO existe en el input, omite esa info completamente.
- ownerSpecialty debe ser genérico al vertical, SIN cifras inventadas. Ejemplo: "Especialista en masajes terapéuticos y técnicas de relajación" (SIN "con X años de experiencia").
- Mejor un campo vacío que uno con mentiras.
- El tagline debe ser atractivo, máximo 60 caracteres.
- La descripción debe tener 2-3 oraciones describiendo el negocio y qué lo hace especial.
- ownerSpecialty: una frase corta describiendo la especialidad del dueño/a (ej: "Especialista en uñas acrílicas y nail art").
- schedule: texto legible del horario sugerido (ej: "Lunes a Sábado: 9:00 AM – 7:00 PM").
${isRestaurant ? "- NO generes servicios, devuelve services como array vacío []." : "- Genera entre 5 y 8 servicios con nombre, duración en minutos, precio en RD$ (número entero sin símbolo) y una descripción corta (1 oración)."}
- Los precios deben ser realistas para República Dominicana.
- Usa descripciones tropicalizadas y cercanas al público dominicano.

Responde SOLO con JSON válido, sin markdown ni explicaciones. El formato exacto:
{
  "tagline": "...",
  "description": "...",
  "schedule": "...",
  "ownerSpecialty": "...",
  "services": [
    { "name": "...", "duration": 45, "price": 1200, "description": "..." }
  ]
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Extract JSON from response (handle possible markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI response did not contain valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as LandingContent;

  // Validate & sanitize
  if (!parsed.tagline || !parsed.description) {
    throw new Error("AI response missing required fields");
  }
  parsed.tagline = parsed.tagline.slice(0, 60);
  parsed.services = parsed.services ?? [];

  return parsed;
}
