/**
 * Admin session management using Web Crypto API.
 * Works in both Edge (middleware) and Node.js (server components / actions).
 *
 * Cookie value: base64(payload_json) + "." + base64(hmac_signature)
 * Payload: { email, iat, exp }
 */

export const ADMIN_COOKIE = "__bookido_admin";
const SESSION_TTL = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "dev-secret-change-in-production";
}

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function b64Encode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b64Decode(str: string): Uint8Array {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

/** Create a signed session token for `email`. */
export async function createSessionToken(email: string): Promise<string> {
  const payload = btoa(
    JSON.stringify({
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
    }),
  );
  const key = await importKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${b64Encode(sig)}`;
}

/** Verify a session token and return the email, or null if invalid/expired. */
export async function verifySessionToken(
  token: string,
): Promise<{ email: string } | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;

    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    const key = await importKey();
    const sigBytes = b64Decode(sig);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer as ArrayBuffer,
      new TextEncoder().encode(payload),
    );
    if (!valid) return null;

    const data = JSON.parse(atob(payload)) as {
      email: string;
      iat: number;
      exp: number;
    };
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return { email: data.email };
  } catch {
    return null;
  }
}
