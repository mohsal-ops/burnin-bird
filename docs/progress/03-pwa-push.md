# 03 — PWA + web push

Branch: `feat/pwa` (stacked on `feat/delivery-routing`). Flags `pwa` and `web_push`, both OFF.

## Built
- Manifest route `/app.webmanifest` (404 when off), generated icons `/api/pwa/icon/[size]` (logo on brand colour).
- `public/sw.js`: push and notification click only, no caching.
- `<PwaBoot>` in the public layout (only when `pwa` is on): manifest and iOS tags, service worker registration, install card from the 2nd visit (Android uses the native prompt; iPhone gets Share → Add to Home Screen steps).
- Web push: `PushSubscription` model (additive), `/api/push/key`, `/api/push/subscribe` (owner must be admin; customer must name a paid order from the last 24h), per-site VAPID keys generated and stored encrypted, revoked subscriptions (404/410) cleaned up.
- Triggers:
  - owner gets a push on each new paid order (`finalizeCart`)
  - customer gets "ready" when a pickup order is marked Completed
  - customer gets "on the way", "delivered" and "problem" from Uber or DoorDash courier status
- Opt-in buttons: success page (customer) and admin → Orders (owner).
- Docs: `docs/pwa/README.md`.

## Verified
- 50 tests pass (6 new: message rules, flag off = no send, VAPID generate-once + encrypted at rest, 410 cleanup, customer scoping, null message = no send).
- `tsc` clean, ESLint clean on new files.
- Not tested on a real phone yet. Needs a deployed preview with the flag on: Android Chrome install and push, iPhone 16.4+ Home Screen push.

## NEEDS MOHSAL
1. When we pick a pilot site, turn on `pwa` and `web_push` on its preview. Then check, on your phone: the install card appears on your 2nd visit; "New-order alerts on this device" in admin → Orders buzzes on a test order.
2. Nothing to buy and no keys to create. VAPID keys generate themselves.

## Update (feat/spec-gaps): aligned to the spec
- **Offline menu view + fast repeat loads**: the service worker uses network-first for pages and cache-first for hashed static files. Offline shows the last menu with a clear banner. Admin, API and checkout are never cached.
- Install card now also appears **right after the first order** (not only on the 2nd visit).
- **Admin → App** page: toggles for `pwa` and `web_push`, sign-up counts, icon and opening-screen preview.
- Explicit consent text on both opt-in buttons, a **Turn off** link (unsubscribe), and an "Order received" push on customer opt-in. Customer updates now cover: received, ready (pickup), on the way, delivered, problem. "Preparing" has no matching order status in the app today, so it isn't sent.
- Lighthouse/PWA audit: **not run** (needs a deployed preview with the flag on). The flags-off path adds nothing to the page (`PwaBoot` isn't rendered and the manifest route 404s), so Core Web Vitals on existing sites can't change.
