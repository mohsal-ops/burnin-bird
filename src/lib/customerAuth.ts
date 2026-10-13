import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Optional customer accounts (flag "customer_accounts"). No passwords and no
// new tables: a customer proves an email with a 6-digit code, then gets a
// signed cookie. Their orders (User/Order by email) and loyalty membership
// (LoyaltyContact by email) already exist, so the account just reads them.
// Guest checkout never changes.
//
// The code is NOT stored anywhere: the server hands the browser a signed
// "challenge" (email + expiry + HMAC of the code) and checks the code against
// it. Keys derive from ADMIN_SECRET with their own labels.

export const CUSTOMER_COOKIE = "sv_customer";
const SESSION_DAYS = 180;
const CODE_MINUTES = 10;

function key(label: string): Buffer {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error("ADMIN_SECRET is not configured");
  return createHash("sha256").update(`${label}:${s}`).digest();
}
const b64 = (s: string) => Buffer.from(s).toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString();
const mac = (label: string, data: string) => createHmac("sha256", key(label)).update(data).digest("base64url");
function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function normalizeEmail(e: unknown): string | null {
  if (typeof e !== "string") return null;
  const v = e.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 200 ? v : null;
}

/** New 6-digit code + the signed challenge the browser keeps until it types the code. */
export function newChallenge(email: string): { code: string; challenge: string } {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const exp = Date.now() + CODE_MINUTES * 60_000;
  const payload = `${email}|${exp}`;
  return { code, challenge: `${b64(payload)}.${mac("customer-code", `${payload}|${code}`)}` };
}

/** Returns the email when the code matches an unexpired challenge. */
export function checkChallenge(challenge: unknown, code: unknown): string | null {
  if (typeof challenge !== "string" || typeof code !== "string" || !/^\d{6}$/.test(code)) return null;
  const [p, sig] = challenge.split(".");
  if (!p || !sig) return null;
  const payload = unb64(p);
  const [email, exp] = payload.split("|");
  if (!email || !exp || Date.now() > Number(exp)) return null;
  return same(sig, mac("customer-code", `${payload}|${code}`)) ? email : null;
}

export function sessionToken(email: string): string {
  const payload = `${email}|${Date.now() + SESSION_DAYS * 86_400_000}`;
  return `${b64(payload)}.${mac("customer-session", payload)}`;
}

export function readSession(token: string | undefined): string | null {
  if (!token) return null;
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;
  const payload = unb64(p);
  const [email, exp] = payload.split("|");
  if (!email || !exp || Date.now() > Number(exp)) return null;
  return same(sig, mac("customer-session", payload)) ? email : null;
}

/** The signed-in customer's email, or null (guest). */
export async function currentCustomerEmail(): Promise<string | null> {
  try {
    return readSession((await cookies()).get(CUSTOMER_COOKIE)?.value);
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_DAYS * 86_400;
