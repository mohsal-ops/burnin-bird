import "server-only";
import db from "@/db/db";
import { decryptJson, encryptJson } from "@/lib/secretBox";
import { getAdapter, isPosProvider } from "./registry";
import type { PosContext, PosCreds, PosEnvironment, PosProvider } from "./types";

// Stored POS connection ↔ adapter context. One active POS per site.
// Tokens live only encrypted in PosConnection.credsEnc.

const REFRESH_WITHIN_MS = 24 * 3600_000;

export async function getActiveConnection() {
  const c = await db.posConnection.findFirst({ where: { status: "connected" }, orderBy: { updatedAt: "desc" } });
  return c && isPosProvider(c.provider) ? c : null;
}

export async function saveConnection(input: {
  provider: PosProvider;
  environment: PosEnvironment;
  creds: PosCreds;
  merchantId?: string | null;
  locationId?: string | null;
}) {
  const data = {
    environment: input.environment,
    merchantId: input.merchantId ?? null,
    locationId: input.locationId ?? null,
    credsEnc: encryptJson("pos-creds", input.creds),
    status: "connected",
    lastError: null,
  };
  // Only one POS can be active: connecting one disconnects the others.
  await db.posConnection.updateMany({
    where: { provider: { not: input.provider }, status: "connected" },
    data: { status: "disconnected" },
  });
  return db.posConnection.upsert({
    where: { provider: input.provider },
    update: data,
    create: { provider: input.provider, ...data },
  });
}

export async function disconnect(provider: PosProvider) {
  await db.posConnection.updateMany({ where: { provider }, data: { status: "disconnected", credsEnc: null } });
}

/** Decrypt creds and refresh them if they expire within a day. */
export async function loadContext(conn: {
  id: string;
  provider: string;
  environment: string;
  merchantId: string | null;
  locationId: string | null;
  credsEnc: string | null;
}): Promise<PosContext> {
  const provider = conn.provider as PosProvider;
  const environment = conn.environment === "production" ? "production" : "sandbox";
  let creds = decryptJson<PosCreds>("pos-creds", conn.credsEnc);
  if (!creds?.accessToken) {
    await db.posConnection.update({
      where: { id: conn.id },
      data: { status: "error", lastError: "Stored POS token can't be read — reconnect the POS." },
    });
    throw new Error("POS token unreadable (ADMIN_SECRET changed?) — reconnect required");
  }
  const adapter = getAdapter(provider);
  const exp = creds.expiresAt ? Date.parse(creds.expiresAt) : NaN;
  if (adapter.refresh && creds.refreshToken && Number.isFinite(exp) && exp - Date.now() < REFRESH_WITHIN_MS) {
    creds = await adapter.refresh(environment, creds);
    await db.posConnection.update({ where: { id: conn.id }, data: { credsEnc: encryptJson("pos-creds", creds) } });
  }
  return { environment, merchantId: conn.merchantId, locationId: conn.locationId, creds };
}
