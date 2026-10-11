import "server-only";
import db from "@/db/db";
import { getStripeConfig } from "@/lib/stripeConfig";
import { r2Enabled } from "@/lib/r2";
import { isEnabled } from "@/lib/flags";
import { deliverySwitchOn } from "@/lib/delivery/settings";
import { isUberDirectConfigured } from "@/lib/uber";
import { evaluateHealth, type HealthFacts } from "./checks";

// Gathers the facts for /admin/health and the daily self-check. Every probe is
// wrapped so one broken thing reports itself instead of crashing the page.

const safe = async <T,>(p: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await p();
  } catch {
    return fallback;
  }
};

export async function gatherHealth() {
  const now = new Date();
  const dbOk = await safe(async () => (await db.$queryRaw`SELECT 1`, true), false);
  const platformTablesOk = await safe(async () => {
    await Promise.all([db.posConnection.findFirst(), db.posOrderSync.findFirst(), db.pushSubscription.findFirst()]);
    await db.cart.findFirst({ select: { deliveryProvider: true } });
    return true;
  }, false);
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);
  const pos = platformTablesOk
    ? await safe(async () => {
        const conn = await db.posConnection.findFirst({ where: { status: { not: "disconnected" } }, orderBy: { updatedAt: "desc" } });
        if (!conn) return null;
        const [manualLast7d, failedNow] = await Promise.all([
          db.posOrderSync.count({ where: { status: "manual", createdAt: { gte: weekAgo } } }),
          db.posOrderSync.count({ where: { status: "failed" } }),
        ]);
        return { provider: conn.provider, status: conn.status, manualLast7d, failedNow, lastError: conn.lastError };
      }, null)
    : null;

  const facts: HealthFacts = {
    dbOk,
    platformTablesOk,
    adminSecret: !!process.env.ADMIN_SECRET,
    stripeSource: await safe(async () => (await getStripeConfig()).source, "none" as const),
    smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
    ownerEmail: !!process.env.OWNER_ALERT_EMAIL,
    telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    r2: r2Enabled(),
    delivery: {
      switchOn: await safe(deliverySwitchOn, false),
      uberConfigured: isUberDirectConfigured(),
      doordashActive: await safe(() => isEnabled("doordash_drive"), false),
    },
    pos,
    staleNewOrders: await safe(
      () => db.cart.count({ where: { status: "new", updatedAt: { lt: new Date(now.getTime() - 6 * 3600_000) } } }),
      0,
    ),
    lastOrderAt: await safe(
      async () =>
        (await db.cart.findFirst({ where: { status: { in: ["new", "completed"] } }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }))
          ?.createdAt ?? null,
      null,
    ),
    jobsSecret: !!process.env.STARVEGA_JOBS_SECRET,
    now,
  };
  return evaluateHealth(facts);
}
