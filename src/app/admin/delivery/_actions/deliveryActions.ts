"use server";
import { assertWritable } from "@/lib/previewGuard";
import db from "@/db/db";
import { revalidatePath } from "next/cache";
import type { UberDirectMode } from "@/lib/siteSettings";

// Owner toggle for Uber Direct courier delivery. Writes the two SiteSetting keys
// read by getUberDirect(). Default (no rows) is OFF, so a brand-new site never
// has courier delivery until the owner turns it on here.
export async function saveUberDirect(input: { enabled: boolean; mode: UberDirectMode }) {
  await assertWritable();
  const mode: UberDirectMode =
    input.mode === "delivery_only" || input.mode === "pickup_only" ? input.mode : "both";
  const enabled = input.enabled ? "true" : "false";
  try {
    await db.siteSetting.upsert({
      where: { key: "uber_direct_enabled" },
      update: { value: enabled },
      create: { key: "uber_direct_enabled", value: enabled },
    });
    await db.siteSetting.upsert({
      where: { key: "uber_direct_mode" },
      update: { value: mode },
      create: { key: "uber_direct_mode", value: mode },
    });
    revalidatePath("/admin/delivery");
    revalidatePath("/Menu");
    return { ok: true };
  } catch (error) {
    console.error("saveUberDirect error:", error);
    return { error: "Couldn't save delivery settings. Try again." };
  }
}

// Live check the owner can run from the Delivery page: authenticates with Uber
// and requests a real quote (nothing is dispatched), returning Uber's exact
// answer - e.g. an account Uber has disabled, which env vars alone can't show.
export async function testUberDirect(): Promise<{ ok: boolean; message: string }> {
  const { testUberConnection } = await import("@/lib/uber");
  const { SITE_CONFIG } = await import("@/lib/siteConfig");
  return testUberConnection({ formatted: SITE_CONFIG.address, lat: SITE_CONFIG.lat, lng: SITE_CONFIG.lng });
}
