# Installable app (PWA) + web push

## Flags
- `pwa` → `/app.webmanifest` (404 when off), `<PwaBoot>` in the public layout: manifest + iOS tags, service worker `/sw.js`, "add to home screen" card from the 2nd visit (dismiss = 30 days quiet).
- `web_push` → `/api/push/key`, `/api/push/subscribe`, the opt-in buttons, and the sends.

## What gets a notification
| Who | When | Where it's triggered |
|---|---|---|
| Owner devices that tapped "New-order alerts on this device" (admin → Orders) | every paid order | `finalizeCart` (after Telegram) |
| Customer who tapped "Notify me…" on the success page | pickup order marked Completed | `updateCartStatus` |
| same | courier picked up / delivered / problem | Uber status callback, DoorDash webhook |

No marketing pushes exist. Push is transactional only — this does not touch the loyalty SMS/TCPA system.

## iPhone facts (docs/research/U5-U6)
- iOS 16.4+ only, and only from the Home Screen app. The opt-in button tells iPhone users to Add to Home Screen first.
- Permission is only asked on a tap.

## Keys
VAPID keys are generated per site on first use and stored encrypted (`SiteSetting vapid_keys`, domain `push-keys`). Optional env override `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`. Never rotate them on a live site: every existing subscription would stop working.

## Icons
`/api/pwa/icon/{180|192|512}[?maskable=1]` draws the restaurant's own logo on its brand colour (next/og), so there are no per-client assets.

## Offline + speed (network-first, never stale)
- Page visits to `/`, `/Menu…`, `/catering`, `/story` are **network first**: the live page always wins. The last good copy is only shown when the phone is offline, with a banner: "You're offline. This is the menu from your last visit. Prices may have changed."
- `/_next/static/*` (content-hashed, never changes) is cache-first → fast repeat loads.
- Never cached: `/admin`, `/api`, checkout/Stripe/purchase pages.

## Admin
Admin → **App** (`/admin/app`): on/off for the install card and for notifications, sign-up counts, and a preview of the home-screen icon and opening screen (both come from Branding).

## Consent
Both opt-in buttons say exactly what will be sent ("only updates about this order, no ads") and offer **Turn off**. The customer's first push is "Order received", which confirms it works.
