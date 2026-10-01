"use server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import db from "@/db/db";
import { ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { verifyAdminSessionToken } from "@/lib/adminSession";
import { STRIPE_KEYS, encryptSecret, getStripeConfig, keyMode } from "@/lib/stripeConfig";

// admin → Payments. The owner pastes their 2 Stripe keys; we check them with
// Stripe, create the payment webhook in THEIR account (no copying URLs) and
// store everything encrypted in this site's DB. Secrets never go back to the
// browser.

type Result = { ok: true; message: string } | { ok: false; error: string };

const WEBHOOK_PATH = "/api/stripe/webhook";
// Older hand-made endpoints for THIS site's host that the new one replaces.
const LEGACY_PATHS = new Set(["/webhook", "/api/GiftCard/webhook", WEBHOOK_PATH]);

// Payment keys need a real signed-in admin - never a preview visitor and never
// an anonymous caller (server actions can be POSTed to from any path).
async function requireRealAdmin() {
  const jar = await cookies();
  const admin = await verifyAdminSessionToken(jar.get(ADMIN_COOKIE_NAME)?.value);
  if (!admin) throw new Error("Please sign in again to change payment settings.");
}

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function friendly(err: unknown): string {
  const e = err as { type?: string; message?: string; code?: string };
  if (e?.type === "StripeAuthenticationError") return "Stripe didn't accept that secret key. Copy it again from your Stripe keys page (it starts with sk_live_).";
  if (e?.type === "StripePermissionError") return "That key can't manage webhooks. Use the main Secret key (sk_live_...), not a restricted key.";
  if (e?.type === "StripeConnectionError") return "Couldn't reach Stripe. Check your connection and try again.";
  return e?.message || "Something went wrong talking to Stripe. Try again.";
}

async function save(rows: Record<string, string>) {
  await db.$transaction(
    Object.entries(rows).map(([key, value]) =>
      db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } }),
    ),
  );
}

export async function connectStripe(input: { secretKey: string; publishableKey: string }): Promise<Result> {
  try {
    await requireRealAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  if (!process.env.ADMIN_SECRET) return { ok: false, error: "This site is missing ADMIN_SECRET - contact Starvega." };

  const sk = (input.secretKey || "").trim();
  const pk = (input.publishableKey || "").trim();
  if (!/^(sk|rk)_(live|test)_[A-Za-z0-9]{10,}$/.test(sk))
    return { ok: false, error: "The secret key should start with sk_live_ (copy the whole thing, click \"Reveal\" first)." };
  if (!/^pk_(live|test)_[A-Za-z0-9]{10,}$/.test(pk))
    return { ok: false, error: "The publishable key should start with pk_live_." };
  if (keyMode(sk) !== keyMode(pk))
    return { ok: false, error: "One key is a test key and the other is live. Copy both from the same page." };

  const stripe = new Stripe(sk);

  // 1. Are the keys real? (also gives us the account's name to show back)
  let accountName = "";
  try {
    const acct = await stripe.accounts.retrieve();
    accountName =
      acct.settings?.dashboard?.display_name || acct.business_profile?.name || acct.email || acct.id;
  } catch (err) {
    const e = err as { type?: string };
    if (e?.type !== "StripePermissionError") return { ok: false, error: friendly(err) };
    try {
      await stripe.balance.retrieve(); // restricted key: at least prove it works
    } catch (err2) {
      return { ok: false, error: friendly(err2) };
    }
  }

  // 2. Create the webhook in their Stripe account (replacing older ones for this site).
  const origin = await siteOrigin();
  const url = `${origin}${WEBHOOK_PATH}`;
  const isLocal = /^http:\/\/|localhost|127\.0\.0\.1/.test(origin);
  let webhookId = "";
  let webhookSecret = "";
  if (!isLocal) {
    try {
      const host = new URL(origin).host;
      const existing = await stripe.webhookEndpoints.list({ limit: 100 });
      for (const ep of existing.data) {
        try {
          const u = new URL(ep.url);
          if (u.host === host && LEGACY_PATHS.has(u.pathname)) await stripe.webhookEndpoints.del(ep.id);
        } catch {
          // skip endpoints we can't parse/delete
        }
      }
      const created = await stripe.webhookEndpoints.create({
        url,
        enabled_events: ["payment_intent.succeeded"],
        description: "Online orders & gift cards (set up automatically by your website)",
        metadata: { createdBy: "starvega-site" },
      });
      webhookId = created.id;
      webhookSecret = created.secret || "";
    } catch (err) {
      return { ok: false, error: friendly(err) };
    }
  }

  try {
    const rows: Record<string, string> = {
      [STRIPE_KEYS.secret]: encryptSecret(sk),
      [STRIPE_KEYS.publishable]: pk,
      [STRIPE_KEYS.accountName]: accountName,
      [STRIPE_KEYS.connectedAt]: new Date().toISOString(),
      [STRIPE_KEYS.webhookUrl]: isLocal ? "" : url,
      [STRIPE_KEYS.webhookId]: webhookId,
      [STRIPE_KEYS.webhookSecret]: webhookSecret ? encryptSecret(webhookSecret) : "",
    };
    await save(rows);
  } catch (err) {
    console.error("connectStripe save error:", err);
    return { ok: false, error: "Stripe is fine but saving failed. Try again." };
  }

  revalidatePath("/admin/payments");
  revalidatePath("/Menu");
  revalidatePath("/GiftCard");
  const mode = keyMode(sk) === "test" ? " (test mode - real cards won't work yet)" : "";
  return {
    ok: true,
    message: isLocal
      ? `Stripe connected${mode}. Webhook skipped on a local address - it's created when you connect on the live site.`
      : `Stripe connected${mode}. You can take card payments now.`,
  };
}

export async function disconnectStripe(): Promise<Result> {
  try {
    await requireRealAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const cfg = await getStripeConfig();
  if (cfg.source === "dashboard") {
    const row = await db.siteSetting.findUnique({ where: { key: STRIPE_KEYS.webhookId } });
    if (row?.value) {
      try {
        await new Stripe(cfg.secretKey).webhookEndpoints.del(row.value);
      } catch {
        // already gone / key revoked - nothing to clean up
      }
    }
  }
  await db.siteSetting.deleteMany({ where: { key: { in: Object.values(STRIPE_KEYS) } } });
  revalidatePath("/admin/payments");
  revalidatePath("/Menu");
  revalidatePath("/GiftCard");
  return { ok: true, message: "Stripe disconnected." };
}

/** Live check: keys still valid + the webhook still exists and is switched on. */
export async function testStripe(): Promise<Result> {
  try {
    await requireRealAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const cfg = await getStripeConfig();
  if (cfg.source === "none") return { ok: false, error: "Stripe isn't connected yet." };
  const stripe = new Stripe(cfg.secretKey);
  try {
    await stripe.balance.retrieve();
  } catch (err) {
    return { ok: false, error: `Keys no longer work: ${friendly(err)} Reconnect with fresh keys.` };
  }
  if (cfg.source === "env") return { ok: true, message: "Keys work (set up the old way, by Starvega)." };

  const row = await db.siteSetting.findUnique({ where: { key: STRIPE_KEYS.webhookId } });
  if (!row?.value) return { ok: true, message: "Keys work. No webhook yet (connect again from the live site to add it)." };
  try {
    const ep = await stripe.webhookEndpoints.retrieve(row.value);
    if (ep.status !== "enabled")
      return { ok: false, error: "Keys work, but the order webhook is disabled in Stripe. Click Reconnect to fix it." };
  } catch {
    return { ok: false, error: "Keys work, but the order webhook was deleted in Stripe. Click Reconnect to fix it." };
  }
  return { ok: true, message: "All good: keys work and Stripe will confirm every order to your site." };
}
