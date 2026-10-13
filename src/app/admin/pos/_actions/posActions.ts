"use server";
import { revalidatePath } from "next/cache";
import db from "@/db/db";
import { assertWritable } from "@/lib/previewGuard";
import { setFlag } from "@/lib/flags";
import { disconnect, getActiveConnection, loadContext, saveConnection } from "@/lib/pos/connection";
import { applyMenuImport, previewMenuImport } from "@/lib/pos/menuImport";
import { retryOne } from "@/lib/pos/pipeline";
import { getAdapter, isPosProvider } from "@/lib/pos/registry";

// Admin → POS. Every mutating action starts with assertWritable() (blocks the
// read-only preview session). Tokens never leave the server.

type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (e: unknown): { ok: false; error: string } => ({ ok: false, error: (e as Error).message.slice(0, 300) });

export async function setPosFeature(flag: "pos_push" | "pos_menu_sync", on: boolean): Promise<R> {
  try {
    await assertWritable();
    await setFlag(flag, on);
    revalidatePath("/admin/pos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function listPosLocations(): Promise<R<{ locations: { id: string; name: string }[] }>> {
  await assertWritable();
  try {
    const conn = await getActiveConnection();
    if (!conn) return { ok: false, error: "No POS connected" };
    const locations = await getAdapter(conn.provider as never).listLocations(await loadContext(conn));
    return { ok: true, locations };
  } catch (e) {
    return fail(e);
  }
}

export async function selectPosLocation(locationId: string): Promise<R> {
  try {
    await assertWritable();
    const conn = await getActiveConnection();
    if (!conn) return { ok: false, error: "No POS connected" };
    await db.posConnection.update({ where: { id: conn.id }, data: { locationId } });
    revalidatePath("/admin/pos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Sandbox testing without OAuth: paste a Square sandbox access token. */
export async function connectSquareSandboxToken(token: string): Promise<R> {
  try {
    await assertWritable();
    const accessToken = token.trim();
    if (!/^[A-Za-z0-9_\-]{20,}$/.test(accessToken)) return { ok: false, error: "That doesn't look like a Square token." };
    const ctx = { environment: "sandbox" as const, creds: { accessToken } };
    const locations = await getAdapter("square").listLocations(ctx); // verifies the token
    await saveConnection({
      provider: "square",
      environment: "sandbox",
      creds: { accessToken },
      locationId: locations.length === 1 ? locations[0].id : null,
    });
    revalidatePath("/admin/pos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function disconnectPos(provider: string): Promise<R> {
  try {
    await assertWritable();
    if (!isPosProvider(provider)) return { ok: false, error: "Unknown POS" };
    await disconnect(provider);
    await setFlag("pos_push", false);
    await setFlag("pos_menu_sync", false);
    revalidatePath("/admin/pos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export type PreviewRow = { kind: string; name: string; changes: string[] };

export async function previewPosMenu(): Promise<
  R<{ counts: { update: number; same: number; create: number; notInPos: number }; rows: PreviewRow[]; notInPos: string[] }>
> {
  await assertWritable();
  try {
    const { plan } = await previewMenuImport();
    return {
      ok: true,
      counts: plan.counts,
      rows: plan.actions
        .filter((a) => a.kind !== "same")
        .map((a) => ({ kind: a.kind, name: a.pos.name, changes: a.kind === "update" ? a.changes : [] })),
      notInPos: plan.notInPos.map((l) => l.name),
    };
  } catch (e) {
    return fail(e);
  }
}

export async function applyPosMenu(createNew: boolean): Promise<R<{ updated: number; created: number }>> {
  try {
    await assertWritable();
    const r = await applyMenuImport({ createNew });
    revalidatePath("/admin/pos");
    revalidatePath("/Menu");
    return { ok: true, updated: r.updated, created: r.created };
  } catch (e) {
    return fail(e);
  }
}

export async function retryPosOrder(syncId: string): Promise<R<{ outcome: string }>> {
  try {
    await assertWritable();
    const outcome = await retryOne(syncId);
    revalidatePath("/admin/pos");
    return { ok: true, outcome };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Sends a clearly labelled TEST order to the POS. Refused unless the connection
 * is in sandbox/test mode, so it can never put a fake order on a live kitchen.
 */
export async function sendPosTestOrder(): Promise<R<{ posOrderId: string }>> {
  try {
    await assertWritable();
    const conn = await getActiveConnection();
    if (!conn) return { ok: false, error: "No POS connected" };
    if (conn.environment !== "sandbox") return { ok: false, error: "Test orders only work in test (sandbox) mode." };
    const { SITE_CONFIG } = await import("@/lib/siteConfig");
    const r = await getAdapter(conn.provider as never).pushOrder(await loadContext(conn), {
      externalId: `test-${Date.now()}`,
      lines: [{ name: "TEST ORDER - please ignore", quantity: 1, unitPriceCents: 100, modifiers: [] }],
      customer: { name: "TEST - Starvega" },
      fulfillment: { type: "pickup", timezone: SITE_CONFIG.timezone, note: "TEST ORDER from the website dashboard" },
      discountCents: 0,
      deliveryFeeCents: 0,
      tipCents: 0,
      totalCents: 100,
    });
    return { ok: true, posOrderId: r.posOrderId };
  } catch (e) {
    return fail(e);
  }
}

/** Owner keyed the order in by hand: stop showing it as a problem. */
export async function resolvePosOrder(syncId: string): Promise<R> {
  try {
    await assertWritable();
    await db.posOrderSync.update({ where: { id: syncId }, data: { status: "resolved", nextRetryAt: null } });
    revalidatePath("/admin/pos");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
