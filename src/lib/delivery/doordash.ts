import { createHmac } from "node:crypto";
import type { DeliveryProvider, DispatchResult } from "./types";

// DoorDash Drive (v2), built against the official docs (see
// docs/research/U7-doordash-drive.md, docs/delivery/doordash-drive.md).
// Each restaurant uses ITS OWN Drive account (it pays DoorDash directly); the
// credentials are pasted in admin → Delivery and stored encrypted.
//
// Auth: a JWT we sign ourselves — header {alg:HS256, typ:JWT, dd-ver:DD-JWT-V1},
// claims {aud:"doordash", iss:developer_id, kid:key_id, iat, exp}, HMAC key =
// base64url-DECODED signing secret. Quotes must be accepted within 5 minutes.

export const DD_BASE = "https://openapi.doordash.com";

export interface DoorDashCreds {
  developerId: string;
  keyId: string;
  signingSecret: string;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

/** Exported for tests. */
export function doordashJwt(c: DoorDashCreds, nowSec = Math.floor(Date.now() / 1000)): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT", "dd-ver": "DD-JWT-V1" }));
  const payload = b64url(JSON.stringify({ aud: "doordash", iss: c.developerId, kid: c.keyId, iat: nowSec, exp: nowSec + 300 }));
  const sig = createHmac("sha256", Buffer.from(c.signingSecret, "base64url")).update(`${header}.${payload}`).digest();
  return `${header}.${payload}.${b64url(sig)}`;
}

/** DoorDash delivery_status → the Uber vocabulary the rest of the app uses. */
export function mapDoorDashStatus(s: string | undefined): string {
  switch (s) {
    case "picked_up":
      return "pickup_complete";
    case "enroute_to_pickup":
    case "arrived_at_pickup":
      return "pickup";
    case "enroute_to_dropoff":
    case "arrived_at_dropoff":
      return "dropoff";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "canceled";
    case "enroute_to_return":
    case "returned":
      return "returned";
    default:
      return "pending";
  }
}

/** Re-quotes get a fresh external id "<cartId>.r<ts>"; this recovers the cart id. */
export const cartIdFromExternal = (externalId: string) => externalId.split(".r")[0];

type DdError = { code?: string; message?: string; field_errors?: { field?: string; error?: string }[] };

async function ddFetch<T>(creds: DoorDashCreds, path: string, body?: unknown): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(`${DD_BASE}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { Authorization: `Bearer ${doordashJwt(creds)}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    const json = (await res.json().catch(() => ({}))) as T & DdError;
    if (!res.ok) {
      const fields = (json.field_errors ?? []).map((f) => `${f.field}: ${f.error}`).join("; ");
      throw new Error(`DoorDash ${res.status}: ${json.message || json.code || "error"}${fields ? ` (${fields})` : ""}`);
    }
    return json;
  } finally {
    clearTimeout(t);
  }
}

type DdQuote = { external_delivery_id: string; fee?: number; dropoff_time_estimated?: string; delivery_status?: string };
type DdDelivery = DdQuote & { tracking_url?: string; support_reference?: string };

export function createDoorDashProvider(getCreds: () => Promise<DoorDashCreds | null>): DeliveryProvider {
  const need = async () => {
    const c = await getCreds();
    if (!c) throw new Error("DoorDash Drive credentials are not set (admin → Delivery).");
    return c;
  };

  return {
    id: "doordash_drive",
    label: "DoorDash",
    async isConfigured() {
      return !!(await getCreds());
    },

    async quote(input) {
      const creds = await need();
      const q = await ddFetch<DdQuote>(creds, "/drive/v2/quotes", {
        external_delivery_id: input.externalId,
        pickup_address: input.pickup.formatted,
        pickup_business_name: input.pickup.businessName,
        pickup_phone_number: input.pickup.phone,
        dropoff_address: input.dropoff.formatted,
        dropoff_phone_number: input.dropoff.phone || input.pickup.phone,
        dropoff_contact_given_name: input.dropoff.name || "Customer",
        ...(input.dropoff.lat != null ? { dropoff_location: { lat: input.dropoff.lat, lng: input.dropoff.lng } } : {}),
        order_value: input.orderValueCents,
      });
      const eta = q.dropoff_time_estimated ? Math.round((Date.parse(q.dropoff_time_estimated) - Date.now()) / 60_000) : NaN;
      return {
        provider: "doordash_drive",
        ref: q.external_delivery_id,
        feeCents: Number(q.fee ?? 0),
        etaMinutes: eta > 0 ? eta : undefined,
        // DoorDash: accept within 5 minutes. Keep a 30s safety margin.
        expiresAt: new Date(Date.now() + 4.5 * 60_000).toISOString(),
      };
    },

    async dispatch(input): Promise<DispatchResult> {
      const creds = await need();
      let ref = input.quote.ref;
      // Quote went stale while the customer was paying → quote again under a
      // fresh external id, then accept that one.
      if (input.quote.expiresAt && Date.parse(input.quote.expiresAt) < Date.now()) {
        ref = `${input.externalId}.r${Date.now().toString(36)}`;
        await ddFetch<DdQuote>(creds, "/drive/v2/quotes", {
          external_delivery_id: ref,
          pickup_address: input.pickup.formatted,
          pickup_business_name: input.pickup.businessName,
          pickup_phone_number: input.pickup.phone,
          pickup_instructions: input.pickup.notes,
          dropoff_address: input.dropoff.formatted,
          dropoff_phone_number: input.dropoff.phone,
          dropoff_contact_given_name: input.dropoff.name,
          dropoff_instructions: input.dropoff.notes,
          ...(input.dropoff.lat != null ? { dropoff_location: { lat: input.dropoff.lat, lng: input.dropoff.lng } } : {}),
          order_value: input.orderValueCents,
        });
      }
      const d = await ddFetch<DdDelivery>(creds, `/drive/v2/quotes/${encodeURIComponent(ref)}/accept`, {});
      return {
        deliveryId: d.external_delivery_id ?? ref,
        status: mapDoorDashStatus(d.delivery_status),
        trackingUrl: d.tracking_url,
        feeCents: d.fee,
      };
    },
  };
}
