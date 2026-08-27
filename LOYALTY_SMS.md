# Loyalty & SMS marketing

Optional paid add-on. OFF by default — enable per site in **admin → Loyalty**.

## ⚠️ Before any real sending (manual, one-time)
Confirm on the shared **Brevo** account that **toll-free / Sender ID registration**
and **"Manage US compliance"** are **ACTIVE**. Until then, US marketing texts will
fail or be non-compliant. The code will not send if `BREVO_API_KEY` is missing, but
it cannot check Brevo's registration status for you.

## What's built
- **Consent** is captured at checkout (unchecked opt-in, never pre-checked). The
  exact wording shown, timestamp, and IP are stored on each `LoyaltyContact`
  (`consentTextVersion`) so it's provable what the customer agreed to. The text
  names the specific business.
- **Sending** uses Brevo SMS with `type: "marketing"` (never "transactional" to
  dodge opt-out/quiet-hours — that's the TCPA violation to avoid). Every message
  gets the `Reply STOP to unsubscribe.` line appended and only sends **8:00am–9:30pm**
  local (`src/lib/loyalty.ts` `withinQuietHours`). Manual blasts and the birthday
  job share one send path — no automated bypass.
- **STOP / unsubscribe**: point Brevo's unsubscribe webhook at
  `/api/loyalty/webhook?key=<BREVO_WEBHOOK_SECRET>` → flips `subscribed=false`.
- **Dashboard** (admin → Loyalty): subscriber count + 14-day growth, "Send a
  special" composer with opt-out preview, birthday automation (off until the owner
  writes + saves a message), compliance panel (live consent text + counts).

## n8n birthday job (Phase 5)
Reuse the existing n8n instance — do NOT build a bespoke cron.

Workflow (daily):
1. **Cron / Schedule** node — once per day, at a time **inside 8am–9:30pm** local.
2. (Fleet) **Get projects** — pull the list of live client site URLs (from the
   builder). For a single site, skip this and hard-code the URL.
3. **HTTP Request** node — `POST https://<site>/api/loyalty/birthday-run?key=<LOYALTY_CRON_SECRET>`
   (or `Authorization: Bearer <LOYALTY_CRON_SECRET>`).

Each call finds subscribed contacts whose birthday is exactly `loyalty_days_ahead`
(default **7**) days away, sends the saved birthday message via the shared send
path (marketing type, quiet-hours, opt-out, logs a `birthday_auto` campaign), and
returns `{ sent }`. It no-ops if the owner hasn't enabled birthdays or saved a
message. Never sends on the birthday itself.
