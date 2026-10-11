# ADR: Native app template: Expo (React Native) vs Capacitor

Status: **Accepted: Expo**. Date: 2026-10-11. Time-boxed (Phase 4, lowest priority).

## Context
We want a white-label iOS + Android app to sell as an add-on, branded per restaurant in days, maintained by one developer. Hard constraints:
- **Apple 4.2 (minimum functionality):** thin website wrappers get rejected. The app must give real native value.
- **Apple 4.2.6:** apps made from a template must be submitted by the **restaurant's own developer account**, not ours (docs/research/U5-U6).
- Reuse the existing site backend (menu, Stripe checkout, finalizeCart, alerts, POS push). The app never stores card data.

## Options
| Criterion | Expo (React Native) | Capacitor wrapping the Next.js site |
|---|---|---|
| Reuse of existing API | Calls small `/api/app/*` JSON endpoints; checkout reuses the site's own Stripe page in an in-app browser | Reuses the whole website as-is |
| App Store risk (4.2) | Low: native menu, cart, order tracking, history, push | **High**: essentially our website in a shell; that's exactly what 4.2 rejects |
| Push notifications | expo-notifications + Expo push service (free), one code path for iOS/Android | Needs Firebase/APNs plugins + native config per app |
| Maintenance (solo dev) | One TypeScript codebase. Yearly SDK upgrades; config-driven branding | Ties app releases to website releases. Native projects to maintain per client |
| Build/deploy | EAS Build in the cloud. **No Mac needed** (we're on Windows) | Needs Xcode on a Mac for iOS builds |
| Cost | EAS free tier works for a few builds a month; paid plan if volume grows | Free tools, but needs Mac hardware |

## Decision
**Expo (SDK 57, Expo Router).** Native screens give real value for 4.2, and EAS builds iOS without a Mac. Branding is one JSON file. Payment stays on the restaurant's own Stripe checkout page, opened in an in-app browser. Apple allows web payment for physical goods (food), and no card data touches the app.

## Shape
- Repo: **new local repo `starvega-native`** (`D:\next-js\projects\starvega-native`). Separate from the site template so it doesn't ship inside 34 client sites.
- Per-client `clients/<slug>.json` → `npm run brand -- clients/<slug>.json [--build]`.
- Screens: menu, item with modifiers (required/max enforced), cart, checkout handoff, order tracking (30s refresh only while open), order history (ids on the device, no account), push opt-in after ordering, hours/contact, loyalty link if the site has it on.
- Site side (branch `feat/native-app`, flag `native_app` OFF): `/api/app/config`, `/api/app/menu`, `/api/app/cart` (re-prices every line server-side), `/api/app/order/[cartId]`, `/api/app/push` (Expo token stored with web push subs; same order events).

## Not in v1 (honest)
- Delivery orders from the app (needs the address + courier quote flow). v1 is pickup only.
- Promo codes and loyalty sign-up inside the app (loyalty opens the site's rewards page).
- Native Stripe Payment Sheet (would avoid the browser hop; needs per-restaurant Stripe publishable key + a PaymentIntent endpoint).
- A run in a simulator: **not done**. This Windows machine has no iOS simulator and no configured Android emulator image, and it's low on RAM/disk. Verified instead: TypeScript clean, `expo config` resolves, and `expo export --platform android` produces a 2.7 MB Hermes bundle.

## Consequences
- Each client app needs: the restaurant's Apple ($99/yr) and Google ($25 once) accounts, an Expo account (theirs or ours as a collaborator), and the `native_app` flag on their site.
- We never submit under our own account.
