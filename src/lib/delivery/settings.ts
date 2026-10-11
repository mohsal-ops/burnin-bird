import "server-only";
import { randomBytes } from "node:crypto";
import db from "@/db/db";
import { isEnabled } from "@/lib/flags";
import { getUberDirect } from "@/lib/siteSettings";
import { decryptJson, encryptJson } from "@/lib/secretBox";
import { createDoorDashProvider, type DoorDashCreds } from "./doordash";
import type { DeliveryStrategy } from "./router";
import type { DeliveryProvider, DeliveryProviderId } from "./types";
import { uberProvider } from "./uberProvider";

// Per-restaurant delivery settings. DoorDash Drive credentials are the
// restaurant's own (it pays DoorDash), stored AES-256-GCM encrypted in
// SiteSetting "doordash_creds". Env DOORDASH_* is a fallback for testing.
//
// The existing "Turn on delivery" switch (uber_direct_enabled) stays the
// master switch for delivery as a whole; the router only decides WHICH courier.

const DD_KEY = "doordash_creds";
const STRATEGY_KEY = "delivery_strategy";

export interface DoorDashSettings extends DoorDashCreds {
  /** We generate it; the owner pastes it into the DoorDash webhook config. */
  webhookSecret: string;
}

export async function getDoorDashSettings(): Promise<DoorDashSettings | null> {
  const row = await db.siteSetting.findUnique({ where: { key: DD_KEY } }).catch(() => null);
  const saved = decryptJson<DoorDashSettings>("delivery-creds", row?.value);
  if (saved?.developerId && saved.keyId && saved.signingSecret) return saved;
  const e = process.env;
  if (e.DOORDASH_DEVELOPER_ID && e.DOORDASH_KEY_ID && e.DOORDASH_SIGNING_SECRET) {
    return {
      developerId: e.DOORDASH_DEVELOPER_ID.trim(),
      keyId: e.DOORDASH_KEY_ID.trim(),
      signingSecret: e.DOORDASH_SIGNING_SECRET.trim(),
      webhookSecret: (e.DOORDASH_WEBHOOK_SECRET || "").trim(),
    };
  }
  return null;
}

export async function saveDoorDashCreds(c: DoorDashCreds): Promise<DoorDashSettings> {
  const prev = await getDoorDashSettings();
  const value: DoorDashSettings = { ...c, webhookSecret: prev?.webhookSecret || randomBytes(24).toString("hex") };
  const enc = encryptJson("delivery-creds", value);
  await db.siteSetting.upsert({ where: { key: DD_KEY }, update: { value: enc }, create: { key: DD_KEY, value: enc } });
  return value;
}

export async function clearDoorDashCreds() {
  await db.siteSetting.deleteMany({ where: { key: DD_KEY } });
}

export async function getDeliveryStrategy(): Promise<DeliveryStrategy> {
  const row = await db.siteSetting.findUnique({ where: { key: STRATEGY_KEY } }).catch(() => null);
  return row?.value === "fastest" ? "fastest" : "cheapest";
}

export async function setDeliveryStrategy(s: DeliveryStrategy) {
  await db.siteSetting.upsert({ where: { key: STRATEGY_KEY }, update: { value: s }, create: { key: STRATEGY_KEY, value: s } });
}

export const doordashProvider = createDoorDashProvider(async () => {
  const s = await getDoorDashSettings();
  return s ? { developerId: s.developerId, keyId: s.keyId, signingSecret: s.signingSecret } : null;
});

export function providerById(id: string | null | undefined): DeliveryProvider {
  return id === "doordash_drive" ? doordashProvider : uberProvider;
}

/** Couriers that may quote right now (master delivery switch is checked by the caller). */
export async function enabledProviders(): Promise<DeliveryProvider[]> {
  const out: DeliveryProvider[] = [];
  if (await uberProvider.isConfigured()) out.push(uberProvider);
  if ((await isEnabled("doordash_drive")) && (await doordashProvider.isConfigured())) out.push(doordashProvider);
  return out;
}

export async function deliverySwitchOn(): Promise<boolean> {
  const u = await getUberDirect();
  return u.enabled && u.mode !== "pickup_only";
}

export type { DeliveryProviderId };
