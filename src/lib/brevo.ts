// Brevo SMS (the account is the agency's shared Brevo, already used by the
// outreach pipeline). Marketing sends MUST use type "marketing" so Brevo applies
// opt-out + US compliance handling — never send promotional content as
// "transactional" to dodge those (the exact TCPA violation to avoid).
//
// PREREQUISITE (manual, not code): Brevo toll-free / Sender ID registration and
// "Manage US compliance" must be ACTIVE on the account before real US sends, or
// messages will fail or be non-compliant. See README note.

export type BrevoSmsType = "marketing" | "transactional";

export async function sendSms(params: {
  to: string; // E.164
  content: string;
  type?: BrevoSmsType; // default marketing
  sender?: string;
}): Promise<{ messageId?: string }> {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("BREVO_API_KEY not set");
  const sender = params.sender || process.env.BREVO_SMS_SENDER || "Rewards";
  const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender,
      recipient: params.to,
      content: params.content,
      type: params.type ?? "marketing",
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
  if (!res.ok) throw new Error(data?.message || `Brevo SMS failed (${res.status})`);
  return { messageId: data.messageId };
}
