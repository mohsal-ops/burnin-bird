# U7: DoorDash Drive API

**Summary (read 2026-10-11):** MOSTLY confirmed (developer.doordash.com could not be fetched directly from this machine; details come from DoorDash's own docs pages as returned by search). Auth is a **JWT** you sign yourself: header `alg: HS256`, `dd-ver: DD-JWT-V1`; claims `aud: "doordash"`, `iss: <developer_id>`, `kid: <key_id>`, `iat`, `exp` (max 30 min after iat; examples use 5 min); the signing secret is **base64url-decoded** before use as the HMAC key. Credentials (developer id, key id, signing secret) are created in the Developer Portal per environment (**Sandbox or Production**). Quote flow: `POST /drive/v2/quotes` → must accept within **5 minutes** via `POST /drive/v2/quotes/{external_delivery_id}/accept` (tip editable at accept). Webhooks are configured in the portal (events include DASHER_CONFIRMED, DASHER_DROPPED_OFF and others).

## Sources
- JWTs: https://developer.doordash.com/docs/drive/how_to/JWTs
- Get started: https://developer.doordash.com/docs/drive/tutorials/get_started
- Quotes: https://developer.doordash.com/en-US/docs/drive/how_to/quote_deliveries

## Not verified
- Full webhook event list and the webhook authentication method (we support a shared-secret header check configurable in admin; verify in portal).
- Whether each restaurant needs its own Drive account. **Design assumption (safest): yes** — each restaurant creates its own DoorDash Developer/Drive account, adds its own billing, and pastes its own credentials in admin → Delivery. Fees are billed to that account. This avoids us being the merchant of record.
- Sandbox test addresses / simulated dasher behavior.

## Design consequence
- `DoorDashDriveProvider` implements the same `DeliveryProvider` interface as Uber. Quote expiry 5 min is shorter than Uber's, so dispatch right after payment and re-quote when stale (router handles this generically via `expiresAt`).
