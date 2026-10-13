"use server";
import { revalidatePath } from "next/cache";
import { assertWritable } from "@/lib/previewGuard";
import { setFlag } from "@/lib/flags";
import { clearDoorDashCreds, doordashProvider, saveDoorDashCreds, setRoutingPolicy } from "@/lib/delivery/settings";
import { SITE_CONFIG } from "@/lib/siteConfig";

// Admin → Delivery → "Couriers" (shown only when the delivery_router flag is
// on). DoorDash credentials are the restaurant's own; stored encrypted and
// never sent back to the browser.

type R = { ok: true; message: string } | { ok: false; error: string };

export async function saveDoorDash(input: { developerId: string; keyId: string; signingSecret: string }): Promise<R> {
  try {
    await assertWritable();
    const c = {
      developerId: input.developerId.trim(),
      keyId: input.keyId.trim(),
      signingSecret: input.signingSecret.trim(),
    };
    if (!c.developerId || !c.keyId || !c.signingSecret) return { ok: false, error: "All three values are required." };
    await saveDoorDashCreds(c);
    // Prove the keys work with a real quote (nothing is dispatched).
    try {
      const q = await doordashProvider.quote({
        externalId: `sv-test-${Date.now()}`,
        pickup: { formatted: SITE_CONFIG.address, businessName: SITE_CONFIG.name, phone: SITE_CONFIG.phone },
        dropoff: { formatted: SITE_CONFIG.address, name: "Test", phone: SITE_CONFIG.phone },
        orderValueCents: 2000,
      });
      await setFlag("doordash_drive", true);
      revalidatePath("/admin/delivery");
      return { ok: true, message: `DoorDash connected — test quote $${(q.feeCents / 100).toFixed(2)}.` };
    } catch (e) {
      revalidatePath("/admin/delivery");
      return { ok: false, error: `Saved, but DoorDash refused a test quote: ${(e as Error).message}` };
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removeDoorDash(): Promise<R> {
  try {
    await assertWritable();
    await clearDoorDashCreds();
    await setFlag("doordash_drive", false);
    revalidatePath("/admin/delivery");
    return { ok: true, message: "DoorDash removed." };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setDoorDashActive(on: boolean): Promise<R> {
  try {
    await assertWritable();
    await setFlag("doordash_drive", on);
    revalidatePath("/admin/delivery");
    return { ok: true, message: on ? "DoorDash on" : "DoorDash off" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function testDoorDash(): Promise<R> {
  await assertWritable();
  try {
    const q = await doordashProvider.quote({
      externalId: `sv-test-${Date.now()}`,
      pickup: { formatted: SITE_CONFIG.address, businessName: SITE_CONFIG.name, phone: SITE_CONFIG.phone },
      dropoff: { formatted: SITE_CONFIG.address, name: "Test", phone: SITE_CONFIG.phone },
      orderValueCents: 2000,
    });
    return { ok: true, message: `DoorDash OK — test quote $${(q.feeCents / 100).toFixed(2)} (nothing dispatched).` };
  } catch (e) {
    return { ok: false, error: `DoorDash: ${(e as Error).message}` };
  }
}

export async function savePolicy(p: {
  strategy: "cheapest" | "fastest" | "preferred";
  preferred: "uber_direct" | "doordash_drive" | null;
  subsidyCents: number;
}): Promise<R> {
  try {
    await assertWritable();
    await setRoutingPolicy({
      strategy: p.strategy === "fastest" || p.strategy === "preferred" ? p.strategy : "cheapest",
      preferred: p.preferred === "uber_direct" || p.preferred === "doordash_drive" ? p.preferred : null,
      subsidyCents: Number.isFinite(p.subsidyCents) ? p.subsidyCents : 0,
    });
    revalidatePath("/admin/delivery");
    return { ok: true, message: "Saved" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
