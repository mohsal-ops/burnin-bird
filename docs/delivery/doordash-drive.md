# DoorDash Drive — status: BUILT (not sandbox-run yet, not live for any client)

- Provider: `src/lib/delivery/doordash.ts`. JWT (HS256, `dd-ver: DD-JWT-V1`, decoded signing secret) → `POST /drive/v2/quotes` → `POST /drive/v2/quotes/{id}/accept`.
- Quote at address entry (router), accept after payment (finalizeCart → `dispatchRoutedDelivery`). Stale quote (>4.5 min) → re-quote as `<cartId>.r<ts>` then accept.
- Status: webhook `POST /api/delivery/doordash/webhook`, `Authorization` = secret shown in admin → Delivery → Couriers. Statuses mapped to the app's Uber vocabulary so the orders dashboard and success page show them.
- Credentials: the restaurant's own Drive account (it pays DoorDash). Stored encrypted (`SiteSetting doordash_creds`, domain `delivery-creds`).

## Turn on for a site
1. Flag `delivery_router` on (agency).
2. Owner: admin → Delivery → Couriers → paste Developer ID / Key ID / Signing secret → a test quote proves the keys → `doordash_drive` flag turns on.
3. Owner adds the webhook (URL + Authorization value shown on the page) in the DoorDash portal.

## Verify
- `npm test` (JWT, status mapping, quote/accept/re-quote with mocked HTTP, router fallback + timeout).
- `npm run sandbox:doordash` with sandbox keys.

## Unverified
- Webhook auth header format (portal lets you set it; we accept raw or `Bearer`).
- Sandbox quote/accept field names were taken from the docs; first sandbox run confirms them.
