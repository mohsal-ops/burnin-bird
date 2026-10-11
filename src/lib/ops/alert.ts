import "server-only";
import db from "@/db/db";
import { sendMail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/siteConfig";

// Error alerts to the agency (Mohsal): failed payment webhooks, POS orders that
// needed manual entry, courier dispatch failures. Throttled to one email per
// kind per hour per site so a burst can't flood the inbox. Also records the
// last occurrence, which /admin/health reads. Never includes secrets.

const THROTTLE_MS = 3600_000;

export async function opsAlert(kind: "stripe_webhook" | "pos_manual" | "courier_dispatch", detail: string) {
  const key = `ops_last:${kind}`;
  const now = new Date();
  try {
    const prev = await db.siteSetting.findUnique({ where: { key } });
    const value = JSON.stringify({ at: now.toISOString(), detail: detail.slice(0, 300) });
    await db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
    const prevAt = prev ? Date.parse((JSON.parse(prev.value) as { at?: string }).at ?? "") : NaN;
    if (Number.isFinite(prevAt) && now.getTime() - prevAt < THROTTLE_MS) return;
    const to = process.env.OPS_ALERT_EMAIL || process.env.AGENCY_ALERT_EMAIL;
    if (!to) return;
    await sendMail({
      to,
      subject: `[${SITE_CONFIG.name}] ${kind.replace(/_/g, " ")} failure`,
      html: `<div style="font-family:system-ui,sans-serif;font-size:14px"><p><b>${SITE_CONFIG.name}</b> (${SITE_CONFIG.siteUrl})</p><p>${detail
        .slice(0, 500)
        .replace(/</g, "&lt;")}</p><p><a href="${SITE_CONFIG.siteUrl}/admin/health">Open health page</a></p></div>`,
    });
  } catch (e) {
    console.error("opsAlert failed:", (e as Error).message);
  }
}

/** Last recorded failure of a kind (for /admin/health). */
export async function lastOpsFailure(kind: string): Promise<{ at: Date; detail: string } | null> {
  const row = await db.siteSetting.findUnique({ where: { key: `ops_last:${kind}` } }).catch(() => null);
  if (!row) return null;
  try {
    const v = JSON.parse(row.value) as { at: string; detail: string };
    return { at: new Date(v.at), detail: v.detail };
  } catch {
    return null;
  }
}
