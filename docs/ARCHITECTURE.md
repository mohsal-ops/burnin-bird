# Architecture (current state, 2026-10-11)

**Repo role:** `burnin-bird` is the **true client-site template**. Every client site (34 live repos under github.com/mohsal-ops) was generated from it by the builder panel and receives updates from it (panel "⤓ Update" sync, or targeted per-file patches). `Southern-Jerks-restaurant` is an older, hand-customised fork (never full-sync it). `tintin-persian-food-truck` and other clients are copies of this template.

## Stack
- Next.js 15.1 (App Router, React 19), TypeScript, Tailwind v4, shadcn-style UI, motion.
- Prisma 7 (`prisma-client-js`, output `generated/prisma`, pg adapter) → Neon Postgres (one DB per client site). Datasource from `prisma.config.ts`.
- Vercel Hobby hosting (limits that matter: 100 deploys/day account-wide, Fluid CPU 4h / rolling 30 days account-wide).
- Stripe (per-restaurant keys pasted in admin → Payments, encrypted with AES-256-GCM keyed from `ADMIN_SECRET`; webhook auto-created).
- Uploads: Cloudflare R2 (`src/lib/r2.ts`, `src/lib/storage.ts`), Vercel Blob fallback. Images served via wsrv.nl custom loader.
- Email: nodemailer SMTP (`src/lib/email.ts`) for owner/customer transactional mail; Brevo (`src/lib/brevo.ts`) for loyalty SMS/email marketing.
- Owner alerts: Telegram (`src/lib/telegram.ts`) + email.

## Data model (Prisma, abridged)
- `Item`, `Types` (categories), `SideGroup`/`SideOption` (modifiers), `CartItemSide` (chosen modifiers snapshot).
- **Orders are Carts.** `Cart.status`: open → paid statuses (`new`, then kitchen statuses, `completed`) — see `src/lib/orderStatus.ts`. `CartItem` holds order type, pickup time, delivery address, customer name/phone. `Order` rows are per-item history for stats only.
- Uber Direct fields live on `Cart` (`uberQuoteId`, `uberFeeCents`, `uberDeliveryId`, `uberStatus`, `uberTrackingUrl`, `uberQuoteError`).
- `SiteSetting` key/value table = per-site settings and feature switches (e.g. `uber_direct_enabled`, `loyalty_enabled`, `theme_palette`, Stripe config).
- Loyalty: `LoyaltyContact`, `LoyaltyCampaign` (TCPA consent stored verbatim + versioned).

## Order flow
1. Cart built client-side via `/api/cart/*` (cookie `cart_id`). Delivery address → `/api/cart/addDelivery` gets a **real Uber quote** or refuses delivery.
2. Checkout creates a Stripe PaymentIntent with `metadata.cartId`.
3. Payment confirmation → `finalizeCart()` (`src/lib/finalizeOrder.ts`), called from BOTH the Stripe webhook (`/api/stripe/webhook`) and the success page; race-safe atomic claim (`updateMany status notIn PAID`).
4. `finalizeCart`: writes `Order` history rows, loyalty redemption, **Uber dispatch** (delivery), Google Sheet log, **owner Telegram + owner email** (always attempted), customer tracking email.
5. Admin `/admin/orders` polls and shows new orders with an alarm.

## Admin
`src/app/admin/*`: orders, menuItems, menuCategories, catering, delivery (Uber settings), loyalty, analytics, payments (Stripe), branding, media, gallery, hours, places, reviews, story, team, blog, profile, content. Access via `getAccess()` (real admin session vs read-only preview; writes guarded by `assertWritable()`).

## Integrations today
- Uber Direct (`src/lib/uber.ts`): env credentials per site (`UBER_DIRECT_CLIENT_ID/SECRET/CUSTOMER_ID`), OFF by default (`uber_direct_enabled`).
- No POS integration. No PWA/push. No tests or test runner. ESLint + `tsc` only.

## Jobs
No cron in-app. External n8n calls secret-protected endpoints (e.g. `/api/loyalty/birthday-run?key=`). Same pattern is used for new jobs.

## Rollout mechanics
Changes reach clients by (a) panel ⤓ Update (full template sync, blocklists per-client files like siteConfig), or (b) targeted per-file commits via GitHub API, only when the client file is byte-identical to the template's previous version. Deploy budget (100/day) means one combined commit per client per rollout.
