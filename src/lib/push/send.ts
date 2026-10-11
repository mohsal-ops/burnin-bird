import "server-only";
import webpush from "web-push";
import db from "@/db/db";
import { isEnabled } from "@/lib/flags";
import { decryptJson, encryptJson } from "@/lib/secretBox";
import { SITE_CONFIG } from "@/lib/siteConfig";
import type { PushPayload } from "./messages";

// Web push (flag "web_push"). VAPID keys: env VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY
// if set, otherwise generated once per site and stored encrypted in SiteSetting
// "vapid_keys" — so no per-client setup is needed. Never logs endpoints.

const VAPID_KEY = "vapid_keys";
type Vapid = { publicKey: string; privateKey: string };

export async function getVapidKeys(): Promise<Vapid> {
  const e = process.env;
  if (e.VAPID_PUBLIC_KEY && e.VAPID_PRIVATE_KEY) return { publicKey: e.VAPID_PUBLIC_KEY.trim(), privateKey: e.VAPID_PRIVATE_KEY.trim() };
  const row = await db.siteSetting.findUnique({ where: { key: VAPID_KEY } });
  const saved = decryptJson<Vapid>("push-keys", row?.value);
  if (saved?.publicKey) return saved;
  const fresh = webpush.generateVAPIDKeys();
  const enc = encryptJson("push-keys", fresh);
  // create (not upsert): if two requests race, the first write wins and the
  // loser re-reads it, so every subscriber uses the same key pair.
  await db.siteSetting.create({ data: { key: VAPID_KEY, value: enc } }).catch(() => {});
  const again = decryptJson<Vapid>("push-keys", (await db.siteSetting.findUnique({ where: { key: VAPID_KEY } }))?.value);
  return again ?? fresh;
}

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

/** Native-app tokens ("expo:<token>") go through Expo's push service. */
async function sendExpo(subs: Sub[], payload: PushPayload): Promise<number> {
  if (!subs.length) return 0;
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        subs.map((s) => ({
          to: s.endpoint.slice(5),
          title: payload.title,
          body: payload.body,
          data: { url: payload.url },
          channelId: "orders",
          sound: "default",
        })),
      ),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { status: string; details?: { error?: string } }[] };
    let ok = 0;
    await Promise.all(
      (json.data ?? []).map(async (t, i) => {
        if (t.status === "ok") ok++;
        else if (t.details?.error === "DeviceNotRegistered") await db.pushSubscription.delete({ where: { id: subs[i].id } }).catch(() => {});
      }),
    );
    return ok;
  } catch {
    console.error("Expo push failed");
    return 0;
  }
}

async function sendTo(allSubs: Sub[], payload: PushPayload) {
  if (!allSubs.length) return 0;
  const expo = allSubs.filter((s) => s.endpoint.startsWith("expo:"));
  const subs = allSubs.filter((s) => !s.endpoint.startsWith("expo:"));
  const expoOk = await sendExpo(expo, payload);
  if (!subs.length) return expoOk;
  const keys = await getVapidKeys();
  const subject = process.env.VAPID_SUBJECT?.trim() || `mailto:${process.env.AGENCY_ALERT_EMAIL || "hello@starvega.app"}`;
  let ok = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { vapidDetails: { subject, publicKey: keys.publicKey, privateKey: keys.privateKey }, TTL: 3600, urgency: "high" },
        );
        ok++;
        await db.pushSubscription.update({ where: { id: s.id }, data: { lastSuccessAt: new Date(), failures: 0 } }).catch(() => {});
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {}); // browser unsubscribed
        } else {
          console.error(`Web push failed (status ${code ?? "?"})`);
          await db.pushSubscription.update({ where: { id: s.id }, data: { failures: { increment: 1 } } }).catch(() => {});
        }
      }
    }),
  );
  return ok + expoOk;
}

/** New paid order → every owner device that opted in. */
export async function pushToOwners(payload: PushPayload): Promise<number> {
  if (!(await isEnabled("web_push"))) return 0;
  const subs = await db.pushSubscription.findMany({ where: { audience: "owner", failures: { lt: 5 } } });
  return sendTo(subs, payload);
}

/** Status update → the customer device(s) that opted in for this order. */
export async function pushToCustomer(cartId: string, payload: PushPayload | null): Promise<number> {
  if (!payload || !(await isEnabled("web_push"))) return 0;
  const subs = await db.pushSubscription.findMany({ where: { audience: "customer", cartId } });
  return sendTo(subs, { ...payload, title: payload.title, body: payload.body || SITE_CONFIG.name });
}
