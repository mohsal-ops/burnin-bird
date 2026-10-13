"use server";
import { assertWritable } from "@/lib/previewGuard";
import db from "@/db/db";
import { revalidatePath } from "next/cache";
import { sendToSubscribed, sendEmailToSubscribed } from "@/lib/loyaltySend";

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
