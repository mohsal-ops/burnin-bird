"use server";
import { assertWritable } from "@/lib/previewGuard";
import db from "@/db/db";
import { revalidatePath } from "next/cache";
import { sendToSubscribed, sendEmailToSubscribed } from "@/lib/loyaltySend";
import { LOYALTY_PROJECT_ID } from "@/lib/loyalty";
import { normalizeCode, BAG_CARD_TYPE, BAG_CARD_OFF_TYPE } from "@/lib/loyaltyPromo";

export async function sendBlast(message: string) {
  await assertWritable();
  const res = await sendToSubscribed(message, "manual_blast");
  revalidatePath("/admin/loyalty");
  return res;
}

export async function sendEmailBlast(subject: string, body: string) {
  await assertWritable();
  const res = await sendEmailToSubscribed(subject, body, "manual_blast");
  revalidatePath("/admin/loyalty");
  return res;
}

export async function setLoyaltyPopupEnabled(enabled: boolean) {
  await assertWritable();
  await db.siteSetting.upsert({
    where: { key: "loyalty_popup_enabled" },
    update: { value: enabled ? "true" : "false" },
    create: { key: "loyalty_popup_enabled", value: enabled ? "true" : "false" },
  });
  revalidatePath("/admin/loyalty");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setLoyaltyEnabled(enabled: boolean) {
  await assertWritable();
  await db.siteSetting.upsert({
    where: { key: "loyalty_enabled" },
    update: { value: enabled ? "true" : "false" },
    create: { key: "loyalty_enabled", value: enabled ? "true" : "false" },
  });
  revalidatePath("/admin/loyalty");
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Save the birthday automation. Enabling REQUIRES a non-empty message the owner
 * has written - never auto-enable with a default message they didn't approve.
 */
export async function saveBirthday(input: { enabled: boolean; message: string }) {
  await assertWritable();
  const message = input.message.trim();
  const enabled = input.enabled && message.length > 0;
  await db.siteSetting.upsert({
    where: { key: "loyalty_birthday_message" },
    update: { value: message },
    create: { key: "loyalty_birthday_message", value: message },
  });
  await db.siteSetting.upsert({
    where: { key: "loyalty_birthday_enabled" },
    update: { value: enabled ? "true" : "false" },
    create: { key: "loyalty_birthday_enabled", value: enabled ? "true" : "false" },
  });
  revalidatePath("/admin/loyalty");
  return { ok: true, enabled };
}

/**
 * Bag card (offer v3): set the standing code printed on delivery/takeout bag
 * cards, e.g. DIRECT for 10% off. It never expires while it's on. Codes must be
 * 3-16 letters/numbers and not clash with another campaign's code.
 */
export async function saveBagCardCode(input: { code: string; discountPercent: number }) {
  await assertWritable();
  const code = normalizeCode(input.code);
  const pct = Math.round(Number(input.discountPercent));
  if (!/^[A-Z0-9]{3,16}$/.test(code)) return { ok: false as const, error: "Use 3 to 16 letters or numbers, like DIRECT." };
  if (!(pct >= 1 && pct <= 50)) return { ok: false as const, error: "Pick a discount between 1% and 50%." };

  const existing = await db.loyaltyCampaign.findFirst({
    where: { projectId: LOYALTY_PROJECT_ID, type: { in: [BAG_CARD_TYPE, BAG_CARD_OFF_TYPE] } },
    orderBy: { sentAt: "desc" },
  });
  const clash = await db.loyaltyCampaign.findFirst({ where: { redemptionCode: code, NOT: existing ? { id: existing.id } : undefined } });
  if (clash) return { ok: false as const, error: "That code is already used by another offer. Pick another." };

  const data = { type: BAG_CARD_TYPE, redemptionCode: code, discountPercent: pct, message: `Bag card: ${pct}% off with ${code}` };
  if (existing) await db.loyaltyCampaign.update({ where: { id: existing.id }, data });
  else await db.loyaltyCampaign.create({ data: { ...data, projectId: LOYALTY_PROJECT_ID, channel: "card", recipientCount: 0 } });
  revalidatePath("/admin/loyalty");
  return { ok: true as const };
}

/** Turn the bag-card code off (kept, so its redemption count isn't lost). */
export async function disableBagCardCode() {
  await assertWritable();
  await db.loyaltyCampaign.updateMany({ where: { projectId: LOYALTY_PROJECT_ID, type: BAG_CARD_TYPE }, data: { type: BAG_CARD_OFF_TYPE } });
  revalidatePath("/admin/loyalty");
  return { ok: true as const };
}

/** The restaurant's Google "write a review" link, shown after an order. */
export async function saveGoogleReviewUrl(url: string) {
  await assertWritable();
  const v = url.trim();
  if (v && !/^https:\/\/[^\s]+$/i.test(v)) return { ok: false as const, error: "Paste the full link, starting with https://" };
  await db.siteSetting.upsert({
    where: { key: "google_review_url" },
    update: { value: v },
    create: { key: "google_review_url", value: v },
  });
  revalidatePath("/admin/loyalty");
  return { ok: true as const };
}
