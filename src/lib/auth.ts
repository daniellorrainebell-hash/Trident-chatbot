/**
 * Single-passkey access control.
 *
 * This is a one-person tool that will sit at a public URL and spend money on
 * every generation. It does not need accounts, roles or a user table. It needs
 * one gate that a stranger cannot walk through.
 *
 * Everything here is Edge-runtime safe (Web Crypto only, no Node imports),
 * because the middleware that enforces it runs on the Edge.
 *
 * The session cookie is `<base64url payload>.<hmac>`, where the payload carries
 * an expiry and the HMAC is keyed on the passkey. Rotating the passkey therefore
 * invalidates every existing session, which is the behaviour you want when the
 * reason you are rotating it is that it leaked.
 */

export const SESSION_COOKIE = "socrates_session";

/** How long a login lasts. */
export const SESSION_DAYS = 30;

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
}

/**
 * Constant-time string comparison.
 *
 * A plain `===` on a signature leaks timing information about how many leading
 * characters matched. It is a small leak and it costs nothing to close.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

export async function createSessionToken(
  secret: string,
  now: number = Date.now(),
): Promise<string> {
  const payload = base64UrlEncode(
    encoder.encode(JSON.stringify({ exp: now + SESSION_DAYS * 86_400_000 })),
  );
  return `${payload}.${await sign(secret, payload)}`;
}

export async function verifySessionToken(
  secret: string,
  token: string | undefined,
  now: number = Date.now(),
): Promise<boolean> {
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expected = await sign(secret, payload);
  if (!safeEqual(signature, expected)) return false;

  try {
    const { exp } = JSON.parse(base64UrlDecode(payload)) as { exp?: number };
    return typeof exp === "number" && exp > now;
  } catch {
    return false;
  }
}

/** Does this passkey match the configured one? */
export function passkeyMatches(configured: string, supplied: string): boolean {
  return configured.length > 0 && safeEqual(configured, supplied);
}

/**
 * Hosts that may run without a passkey.
 *
 * Local development stays frictionless. Anything else fails closed, because an
 * unprotected deployment spends the owner's money on request.
 */
export function isLocalHost(host: string | null): boolean {
  if (!host) return false;
  const name = host.split(":")[0]?.toLowerCase() ?? "";
  return name === "localhost" || name === "127.0.0.1" || name === "::1" || name === "0.0.0.0";
}
