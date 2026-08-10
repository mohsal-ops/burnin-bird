// Signed, stateless admin session tokens. Verified with the Web Crypto API
// (crypto.subtle) so the same code works in both the Edge runtime
// (middleware) and Node API routes, without needing a sessions table or a
// new secret - it reuses ADMIN_SECRET as the HMAC signing key.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24h

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const padded = b64url + "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getSigningKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createAdminSessionToken(adminId: string): Promise<string> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET is not configured");

  const payloadBytes = encoder.encode(
    JSON.stringify({ id: adminId, exp: Date.now() + SESSION_TTL_MS }),
  );
  const payloadB64 = bytesToBase64Url(payloadBytes);

  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigB64 = bytesToBase64Url(new Uint8Array(signature));

  return `${payloadB64}.${sigB64}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null,
): Promise<{ id: string } | null> {
  if (!token) return null;
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;

  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  try {
    const key = await getSigningKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(sigB64) as BufferSource,
      encoder.encode(payloadB64),
    );
    if (!valid) return null;

    const payload = JSON.parse(decoder.decode(base64UrlToBytes(payloadB64))) as {
      id: string;
      exp: number;
    };
    if (!payload.id || typeof payload.exp !== "number" || Date.now() > payload.exp) {
      return null;
    }
    return { id: payload.id };
  } catch {
    return null;
  }
}
