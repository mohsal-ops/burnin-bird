import "server-only";
import { cache } from "react";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import Stripe from "stripe";
import db from "@/db/db";

// Where this site's Stripe keys come from.
//
// NEW (admin → Payments): the owner pastes their 2 keys once; we check them with
// Stripe, create the payment webhook in THEIR Stripe account automatically and
// save everything in this site's database (secrets encrypted with ADMIN_SECRET).
// No developer dashboard, no webhook URLs to copy.
//
// OLD (env vars, still honoured): STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLIC_KEY
// / STRIPE_WEBHOOK_SECRET / STRIPE_GIFTCARD_WEBHOOK_SECRET. Used whenever the
// dashboard hasn't been connected, so existing sites keep working untouched.

export const STRIPE_KEYS = {
  secret: "stripe_sk_enc",
  publishable: "stripe_pk",
  webhookSecret: "stripe_whsec_enc",
  webhookId: "stripe_wh_id",
  webhookUrl: "stripe_wh_url",
  accountName: "stripe_account_name",
  connectedAt: "stripe_connected_at",
} as const;

export type StripeConfig = {
  secretKey: string;
  publishableKey: string;
  /** signing secrets accepted by the webhook (dashboard one first, then env ones) */
  webhookSecrets: string[];
  source: "dashboard" | "env" | "none";
  mode: "live" | "test" | null;
  accountName: string;
  webhookUrl: string;
  connectedAt: string;
};

function encKey(): Buffer | null {
  const s = process.env.ADMIN_SECRET;
  return s ? createHash("sha256").update(`stripe-keys:${s}`).digest() : null;
}

export function encryptSecret(plain: string): string {
  const key = encKey();
  if (!key) throw new Error("ADMIN_SECRET is not configured");
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), body.toString("base64")].join(":");
}

function decryptSecret(stored: string): string {
  const key = encKey();
  const [v, iv, tag, body] = stored.split(":");
  if (!key || v !== "v1" || !iv || !tag || !body) return "";
  try {
    const d = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(body, "base64")), d.final()]).toString("utf8");
  } catch {
    return ""; // ADMIN_SECRET changed - treat as not connected
  }
}

export function keyMode(key: string): "live" | "test" | null {
  if (/^(sk|rk|pk)_live_/.test(key)) return "live";
  if (/^(sk|rk|pk)_test_/.test(key)) return "test";
  return null;
}

/** Per-request Stripe config: dashboard-connected keys win, else env vars. */
export const getStripeConfig = cache(async (): Promise<StripeConfig> => {
  const envSecrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_GIFTCARD_WEBHOOK_SECRET].filter(
    (s): s is string => !!s,
  );

  let rows: Record<string, string> = {};
  try {
    const found = await db.siteSetting.findMany({ where: { key: { in: Object.values(STRIPE_KEYS) } } });
    rows = Object.fromEntries(found.map((r) => [r.key, r.value]));
  } catch {
    // DB hiccup: fall through to env
  }

  const dbSecret = rows[STRIPE_KEYS.secret] ? decryptSecret(rows[STRIPE_KEYS.secret]) : "";
  const dbPublishable = rows[STRIPE_KEYS.publishable] || "";
  if (dbSecret && dbPublishable) {
    const wh = rows[STRIPE_KEYS.webhookSecret] ? decryptSecret(rows[STRIPE_KEYS.webhookSecret]) : "";
    return {
      secretKey: dbSecret,
      publishableKey: dbPublishable,
      webhookSecrets: [wh, ...envSecrets].filter(Boolean),
      source: "dashboard",
      mode: keyMode(dbSecret),
      accountName: rows[STRIPE_KEYS.accountName] || "",
      webhookUrl: rows[STRIPE_KEYS.webhookUrl] || "",
      connectedAt: rows[STRIPE_KEYS.connectedAt] || "",
    };
  }

  const envSecret = process.env.STRIPE_SECRET_KEY || "";
  const envPublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "";
  return {
    secretKey: envSecret,
    publishableKey: envPublishable,
    webhookSecrets: envSecrets,
    source: envSecret && envPublishable ? "env" : "none",
    mode: keyMode(envSecret),
    accountName: "",
    webhookUrl: "",
    connectedAt: "",
  };
});

/** Stripe client for this site, or null when no keys are set up yet. */
export async function getStripe(): Promise<Stripe | null> {
  const { secretKey } = await getStripeConfig();
  return secretKey ? new Stripe(secretKey) : null;
}

/** Same, but throws - for code paths that can't continue without Stripe. */
export async function requireStripe(): Promise<Stripe> {
  const s = await getStripe();
  if (!s) throw new Error("Online payments aren't set up yet (admin → Payments).");
  return s;
}
