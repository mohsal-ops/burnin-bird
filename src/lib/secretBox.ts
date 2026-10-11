import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Encryption at rest for third-party tokens (POS OAuth tokens, courier keys…).
// AES-256-GCM, 12-byte random IV, auth tag. The key is derived from the
// existing ADMIN_SECRET env var (already set on every client site) with a
// per-domain label, so a leaked POS ciphertext can't be decrypted with the
// Stripe derivation and vice versa. Same "v1:iv:tag:body" format as the Stripe
// keys in lib/stripeConfig.ts.
//
// Never log the plaintext. decrypt() returns "" when the secret changed or the
// payload is corrupt, so callers treat that as "not connected".

export type SecretDomain = "pos-creds" | "delivery-creds" | "push-keys";

function keyFor(domain: SecretDomain): Buffer {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error("ADMIN_SECRET is not configured");
  return createHash("sha256").update(`${domain}:${s}`).digest();
}

export function encryptJson(domain: SecretDomain, value: unknown): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", keyFor(domain), iv);
  const body = Buffer.concat([c.update(JSON.stringify(value), "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), body.toString("base64")].join(":");
}

export function decryptJson<T = unknown>(domain: SecretDomain, stored: string | null | undefined): T | null {
  if (!stored) return null;
  const [v, iv, tag, body] = stored.split(":");
  if (v !== "v1" || !iv || !tag || !body) return null;
  try {
    const d = createDecipheriv("aes-256-gcm", keyFor(domain), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    const plain = Buffer.concat([d.update(Buffer.from(body, "base64")), d.final()]).toString("utf8");
    return JSON.parse(plain) as T;
  } catch {
    return null;
  }
}

/** Mask a token for display/logging: "sq0atp-****abcd". Never log full tokens. */
export function maskSecret(s: string | null | undefined): string {
  if (!s) return "";
  return s.length <= 8 ? "****" : `${s.slice(0, 6)}****${s.slice(-4)}`;
}

/** Mask a phone number for logs: "+1******4567". */
export function maskPhone(p: string | null | undefined): string {
  if (!p) return "";
  const d = p.replace(/[^\d+]/g, "");
  return d.length <= 4 ? "****" : `${d.slice(0, 2)}${"*".repeat(Math.max(0, d.length - 6))}${d.slice(-4)}`;
}
