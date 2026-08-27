// Server-only Uber Direct client (customer-based Direct API — courier dispatch,
// NOT the Uber Eats marketplace). Manual pickup/dropoff addresses, no store or
// menu sync, no commission. Never import this into a client component; it reads
// the Uber secret.
//
// Auth: OAuth2 client_credentials → https://auth.uber.com/oauth/v2/token
//   scope "eats.deliveries"; tokens last ~30 days, so we cache in memory.
// Quote:  POST https://api.uber.com/v1/customers/{customer_id}/delivery_quotes
// Create: POST https://api.uber.com/v1/customers/{customer_id}/deliveries
// (Re-verify exact field spellings against the live reference if Uber changes them.)

const TOKEN_URL = "https://auth.uber.com/oauth/v2/token";
const API_BASE = "https://api.uber.com/v1";

function creds() {
  const clientId = process.env.UBER_DIRECT_CLIENT_ID;
  const clientSecret = process.env.UBER_DIRECT_CLIENT_SECRET;
  const customerId = process.env.UBER_DIRECT_CUSTOMER_ID;
  if (!clientId || !clientSecret || !customerId) {
    throw new Error(
      "Uber Direct is not configured — set UBER_DIRECT_CLIENT_ID, UBER_DIRECT_CLIENT_SECRET, UBER_DIRECT_CUSTOMER_ID.",
    );
  }
  return { clientId, clientSecret, customerId };
}

// Cache the token across requests (client-credential calls are rate-limited).
let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt - 60_000) return cached.token;
  const { clientId, clientSecret } = creds();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "eats.deliveries",
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(`Uber Direct auth failed (${res.status}).`);
  }
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 2_592_000) * 1000,
  };
  return cached.token;
}

async function uberFetch(path: string, body: unknown) {
  const { customerId } = creds();
  const token = await accessToken();
  const res = await fetch(`${API_BASE}/customers/${customerId}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string; code?: string })?.message
      || (data as { code?: string })?.code
      || `Uber Direct request failed (${res.status})`;
    const err = new Error(msg) as Error & { status?: number; body?: unknown };
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data as Record<string, unknown>;
}

export type UberAddress = {
  formatted: string; // single-line address
  lat?: number | null;
  lng?: number | null;
};

export type UberQuote = {
  id: string;
  feeCents: number;
  currency: string;
  dropoffEtaMs?: number;
  durationMin?: number;
  expiresMs?: number;
};

/** Real delivery quote for a pickup→dropoff pair. Throws on no-courier / out-of-range. */
export async function getQuote(pickup: UberAddress, dropoff: UberAddress): Promise<UberQuote> {
  const d = await uberFetch("/delivery_quotes", {
    pickup_address: pickup.formatted,
    dropoff_address: dropoff.formatted,
    ...(pickup.lat != null ? { pickup_latitude: pickup.lat, pickup_longitude: pickup.lng } : {}),
    ...(dropoff.lat != null ? { dropoff_latitude: dropoff.lat, dropoff_longitude: dropoff.lng } : {}),
  });
  return {
    id: String(d.id),
    feeCents: Number(d.fee ?? 0),
    currency: String(d.currency ?? "usd"),
    dropoffEtaMs: d.dropoff_eta ? Number(d.dropoff_eta) : undefined,
    durationMin: d.duration ? Number(d.duration) : undefined,
    expiresMs: d.expires ? new Date(String(d.expires)).getTime() : undefined,
  };
}

export type UberDelivery = {
  id: string;
  status: string;
  trackingUrl?: string;
  feeCents: number;
};

/** Dispatch a courier. Requires a fresh quoteId. Throws on failure. */
export async function createDelivery(params: {
  quoteId?: string;
  pickup: UberAddress & { name: string; phone: string; businessName?: string; notes?: string };
  dropoff: UberAddress & { name: string; phone: string; notes?: string };
  manifestItems: { name: string; quantity: number }[];
  externalId?: string;
}): Promise<UberDelivery> {
  const { pickup, dropoff } = params;
  const d = await uberFetch("/deliveries", {
    ...(params.quoteId ? { quote_id: params.quoteId } : {}),
    pickup_name: pickup.name,
    pickup_address: pickup.formatted,
    pickup_phone_number: pickup.phone,
    ...(pickup.businessName ? { pickup_business_name: pickup.businessName } : {}),
    ...(pickup.notes ? { pickup_notes: pickup.notes } : {}),
    ...(pickup.lat != null ? { pickup_latitude: pickup.lat, pickup_longitude: pickup.lng } : {}),
    dropoff_name: dropoff.name,
    dropoff_address: dropoff.formatted,
    dropoff_phone_number: dropoff.phone,
    ...(dropoff.notes ? { dropoff_notes: dropoff.notes } : {}),
    ...(dropoff.lat != null ? { dropoff_latitude: dropoff.lat, dropoff_longitude: dropoff.lng } : {}),
    manifest_items: params.manifestItems.map((i) => ({ name: i.name, quantity: i.quantity })),
    ...(params.externalId ? { external_id: params.externalId } : {}),
  });
  return {
    id: String(d.id),
    status: String(d.status ?? "pending"),
    trackingUrl: d.tracking_url ? String(d.tracking_url) : undefined,
    feeCents: Number(d.fee ?? 0),
  };
}

/** Current state of a delivery (used to reconcile if a webhook is missed). */
export async function getDelivery(deliveryId: string): Promise<UberDelivery> {
  const { customerId } = creds();
  const token = await accessToken();
  const res = await fetch(`${API_BASE}/customers/${customerId}/deliveries/${encodeURIComponent(deliveryId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(`Uber Direct get-delivery failed (${res.status}).`);
  return {
    id: String(d.id),
    status: String(d.status ?? "pending"),
    trackingUrl: d.tracking_url ? String(d.tracking_url) : undefined,
    feeCents: Number(d.fee ?? 0),
  };
}
