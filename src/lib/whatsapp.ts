const WA_API_KEY = process.env.WA_API_KEY ?? "bookido-wa-key-2026";
const DEFAULT_GATEWAY = process.env.WA_GATEWAY_URL ?? "http://127.0.0.1:3001";

export async function sendWhatsApp(phone: string, message: string, gatewayUrl?: string | null): Promise<void> {
  const WA_GATEWAY = gatewayUrl || DEFAULT_GATEWAY;
  try {
    const res = await fetch(`${WA_GATEWAY}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": WA_API_KEY },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[wa] send failed:", res.status, body);
    }
  } catch (err) {
    console.error("[wa] send error:", err);
  }
}
