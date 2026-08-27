"use server";
import { assertWritable } from "@/lib/previewGuard";
import db from "@/db/db";
import { revalidatePath } from "next/cache";
import { sendSms } from "@/lib/brevo";
import { withinQuietHours, withOptOut, LOYALTY_PROJECT_ID } from "@/lib/loyalty";

type LoyaltyContactRow = { phone: string; firstName: string | null };

function toE164(phone: string): string {
  const p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) return p;
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return `+${d}`;
}

function personalize(body: string, c: LoyaltyContactRow): string {
  return body.replace(/\{firstName\}/gi, c.firstName || "there");
}

/**
 * Send a marketing message to every currently-subscribed contact. Enforces the
 * SAME rules for manual blasts and automated birthday sends — quiet hours + the
 * appended opt-out line + subscribed=true — no bypass path. Logs a LoyaltyCampaign.
 * Outside quiet hours it does NOT send (returns queued=true).
 */
export async function sendToSubscribed(
  message: string,
  type: "manual_blast" | "birthday_auto",
  recipients?: LoyaltyContactRow[],
): Promise<{ sent: number; queued?: boolean; error?: string }> {
  if (!message.trim()) return { sent: 0, error: "Message is empty." };
  if (!withinQuietHours()) {
    // TCPA: never send promotional SMS outside 8am–9:30pm local. Owner is told to
    // send during allowed hours; the birthday job is scheduled inside them.
    return { sent: 0, queued: true, error: "Outside texting hours (8am–9:30pm). Not sent." };
  }
  const contacts =
    recipients ??
    (await db.loyaltyContact.findMany({
      where: { projectId: LOYALTY_PROJECT_ID, subscribed: true },
      select: { phone: true, firstName: true },
    }));

  const body = withOptOut(message);
  let sent = 0;
  for (const c of contacts) {
    try {
      await sendSms({ to: toE164(c.phone), content: personalize(body, c), type: "marketing" });
      sent++;
    } catch (e) {
      console.error("loyalty sms failed for", c.phone, (e as Error).message);
    }
  }
  await db.loyaltyCampaign.create({
    data: { projectId: LOYALTY_PROJECT_ID, message, type, recipientCount: sent },
  });
  return { sent };
}

export async function sendBlast(message: string) {
  await assertWritable();
  const res = await sendToSubscribed(message, "manual_blast");
  revalidatePath("/admin/loyalty");
  return res;
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
 * has written — never auto-enable with a default message they didn't approve.
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
