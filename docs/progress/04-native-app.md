# 04 — Native app template (time-boxed)

Decision: **Expo** (see `docs/native-app/ADR.md`).

## Built
**App:** new local repo `D:\next-js\projects\starvega-native` (Expo SDK 57, Expo Router). Not pushed: no GitHub repo exists yet (see NEEDS MOHSAL).
- Branding is one JSON file (`clients/<slug>.json` → `npm run brand`), and `app.config.ts` reads it (name, bundle ids, icon, splash, colours, API URL, features). `--build` starts EAS cloud builds.
- Screens: menu, item with modifiers, cart, checkout handoff (the site's own Stripe page in an in-app browser, no card data in the app), live order status (30s refresh only while open), order history (on-device ids, no account), "Notify me" push after ordering, hours/contact, loyalty link if on.
- `CLIENT_ONBOARDING.md`: restaurant's own Apple/Google/Expo accounts, store asset sizes, privacy/data-safety answers, review notes, submit commands. Never submit under our account.

**Site side** (this branch `feat/native-app`, flag `native_app` OFF; toggle in admin → App):
- `/api/app/config`, `/api/app/menu`, `/api/app/cart`, `/api/app/order/[cartId]`, `/api/app/push`. All return 404 while the flag is off.
- `/api/app/cart` re-prices every line from the DB with the same modifier rules as the site (`src/lib/app/pricing.ts`, unit-tested), creates a normal pickup Cart, and returns `/Menu/<cartId>/purchase`. So payment, `finalizeCart`, owner alerts, POS push and the monthly report all just work.
- Expo push tokens are stored with web push subscriptions (`expo:<token>`) and sent through Expo's push service, triggered by the same order events (received/ready/on the way/delivered).

## Verified
- Site: 72 tests pass (3 new pricing tests), `tsc` and ESLint clean.
- App: `tsc` clean, `expo config` resolves, `expo export --platform android` built a 2.7 MB Hermes bundle, `npm run brand` validates and correctly warns that the live site's app API is still off (404).
- **Not run in a simulator or on a device.** No iOS simulator on Windows. An Android emulator image isn't set up, and the machine is short on RAM/disk (C: has about 3 GB free). This is the main gap.

## v1 limits
Pickup only. No promo codes in the app. Loyalty opens the website's rewards page. Card entry is on the web checkout (a native Payment Sheet is a follow-up).

## NEEDS MOHSAL
1. Create a private GitHub repo `starvega-native`, then: `cd D:\next-js\projects\starvega-native && git remote add origin <url> && git push -u origin main`.
2. First real run: install **Expo Go** on your phone, turn on `native_app` on a test site, set `apiBaseUrl` to it, `npx expo start`, scan the QR.
3. Only when a client buys the app: their Apple Developer ($99/yr, organization + D-U-N-S) and Google Play ($25) accounts, an Expo account, with you invited (steps in `CLIENT_ONBOARDING.md`).
4. Delete the leftover export folder `D:\tmp-sv-export` (bundle test output). My cleanup was blocked by a safety check.
