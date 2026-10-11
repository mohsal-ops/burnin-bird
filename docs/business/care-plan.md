# Care plan (draft for Mohsal to confirm)

Starvega sites are a one-time purchase. The care plan is the optional monthly add-on that keeps a live ordering site healthy. **Prices are suggestions, marked TO CONFIRM BY MOHSAL. Nothing here is published.**

## Honest support hours
Mohsal works alone from Algeria (UTC+1). That's 6 hours ahead of US Eastern and 7 ahead of Central.
- **Support window:** Monday to Saturday, 2:00pm to 11:00pm Algeria time = **8:00am to 5:00pm US Eastern / 7:00am to 4:00pm Central**.
- Outside that window, messages are read the next support day.
- Channels: email and WhatsApp. No phone line.

## Response times I can actually keep
| Problem | Example | First reply | Fix target |
|---|---|---|---|
| **Orders are stopped** | can't pay online, site down, every order failing | within 2 hours inside the support window; by the next morning (US) if it happens at night | same day where possible |
| **Something is broken but orders still work** | POS link failed (orders still arrive by email/Telegram), photo upload error | same support day | within 2 support days |
| **Changes** | menu edits, prices, hours, photos, text | within 1 support day | within 3 support days |

Order alerts don't depend on me being awake: every order still reaches the owner by email, Telegram, and the kitchen alarm (and push, if on). The website keeps taking orders even if a POS or courier link has a problem.

## What's included
- Daily automatic health check of the site (`/admin/health` + daily self-check). I get an email only when something is amber or red.
- Error alerts to me for failed payment webhooks, POS orders needing manual entry, and courier dispatch failures.
- Fixes for anything the health check or alerts flag.
- Platform updates and security fixes, rolled out in batches.
- Up to **30 minutes a month** of small changes (menu, prices, hours, photos, text). Owners can also do these themselves in the dashboard.
- Monthly results email to the owner (orders, sales, top items, estimated app fees saved).
- Keeping integrations connected (Stripe, POS, couriers): reconnects, expired tokens, provider API changes.

## Not included (quoted separately)
- New features, new pages, redesigns, new integrations.
- Fees charged by Stripe, Uber, DoorDash, Square/Clover, Brevo/SMS, domain registrars. The restaurant pays those companies directly.
- Marketing, ads, social media management.
- Problems caused by the restaurant's own accounts (for example a Stripe account Stripe has restricted). I help, but the fix is on the provider's side.
- Native app store updates (separate add-on).

## Suggested pricing (TO CONFIRM BY MOHSAL)
| Tier | What | Price |
|---|---|---|
| Care | everything above | $49/month |
| Care Plus | + up to 2 hours of changes a month + a quarterly review call | $99/month |

Month to month. Paid in advance. Cancel any time. If a plan lapses, the site keeps running but monitoring and fixes stop.

## Agency runbook (daily, about 5 minutes)
1. Read the digest email. It only arrives if a site has a problem.
2. Open `<site>/admin/health` for each site listed.
3. Red: fix now (reconnect Stripe or the POS, set the missing env, run migrate-client-dbs). Amber: note it and fix within the target above.
4. POS "enter by hand" orders: check the owner keyed them in (they also see a red banner), then find out why the push failed.
