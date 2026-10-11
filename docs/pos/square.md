# Square — status: BUILT (sandbox-ready, not yet live for any client)

## What it does
- **Connect**: admin → POS → Connect Square (OAuth). Tokens stored AES-256-GCM encrypted (`PosConnection.credsEnc`), refreshed automatically within 24h of expiry.
- **Orders**: on a paid website order (flag `pos_push`), `CreateOrder` → `CreatePayment` (`source_id: "EXTERNAL"`, `autocomplete:false`) → `PayOrder`. Shows in Square POS / Order Manager / KDS as a paid order.
  - Lines are sent as named ad-hoc items at the exact price the customer paid (modifier prices split out) so the Square total equals what Stripe charged. Linking lines to Square catalog ids (for inventory counts) is a follow-up.
  - Delivery orders are sent as **PICKUP** with `DELIVERY (courier) to: <address>` in the note — Square's DELIVERY fulfillment looks partner-only (docs/research/U1-U2).
  - Promo = order-level discount; delivery fee = service charge. No tip at checkout today.
  - Idempotency keys `sv-order-/sv-pay-/sv-payorder-<cartId>` → retries never duplicate.
- **Menu**: "Check menu" previews price / sold-out changes; "Apply" updates matched items, optionally creates new ones (with modifier lists as option groups). n8n can call `/api/pos/menu-sync` (flag `pos_menu_sync`) to keep prices + sold-out in sync. Never deletes items.

## Setup (once, agency)
1. developer.squareup.com → create app "Starvega Online Ordering".
2. OAuth → Redirect URL = the builder relay `https://<builder>/api/pos/oauth/callback` (Square allows ONE redirect URL per app). Put the same URL in every client's `POS_OAUTH_REDIRECT_URL`.
3. Env on client sites: `SQUARE_APPLICATION_ID`, `SQUARE_APPLICATION_SECRET` (+ `SQUARE_SANDBOX_APPLICATION_ID/SECRET` for testing).
4. Square App Marketplace listing is NOT needed for OAuth with individual sellers, but Square may review apps that call production; check the app's "Production" tab before first live client.

## Verify
- `npm test` (contract tests, mocked HTTP)
- `SQUARE_SANDBOX_ACCESS_TOKEN=… npm run sandbox:square` → creates a $1 sandbox order and proves idempotency.
- Or in admin → POS → "Testing: paste a Square sandbox token".

## Not done / known limits
- Square webhooks (catalog changes push instantly) — needs the builder relay to route by merchant id; using scheduled menu-sync instead (CPU-cheap).
- Taxes: site doesn't charge tax separately today; if Square has auto-tax rules they don't apply to ad-hoc lines, so totals still match.
