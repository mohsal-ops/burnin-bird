# Offboarding checklist (client leaving)

Do this in order. First confirm all invoices are paid (Service Agreement, section 9). Work done after paid offboarding hours runs out is billed hourly.

## 1. Before anything is switched off
- [ ] All invoices paid (or written agreement on what stays on our hosting until paid).
- [ ] Agree the last day of service in writing.
- [ ] Tell the client which features stop working on that day.

## 2. Data export (give the client a copy)
- [ ] Orders (all carts with status new/completed): CSV with date, items, totals, pickup/delivery.
- [ ] Customers / loyalty contacts **with consent records** (consent text version, timestamp, unsubscribes). They need these to keep texting legally.
- [ ] Menu (items, prices, categories, modifiers) as CSV/JSON.
- [ ] Photos and media (R2 / gallery URLs, or a zip).
- [ ] Send through a private link, not an email attachment. Confirm receipt.

## 3. Domain and DNS
- [ ] Domain is in the client's own registrar account (if not, transfer it now).
- [ ] Point DNS where the client wants. Remove our Vercel records only after their new site is live.
- [ ] Remove our access to their registrar/DNS.

## 4. Keys and accounts: rotate, disconnect, remove access
- [ ] **Stripe:** client deletes the webhook we created and rolls their API keys in Stripe → Developers. Remove any team access we had.
- [ ] **POS (Square/Clover):** disconnect in admin → POS. Client revokes the app in their Square/Clover dashboard.
- [ ] **Couriers:** DoorDash Drive: client rotates their keys and removes our webhook. Uber Direct: stop dispatch from our account if we were using the agency account.
- [ ] **SMS/email (Brevo):** stop campaigns for this client, and export or delete their contact list per their instruction.
- [ ] **Telegram/email alerts:** remove their chat ID and email from our env.
- [ ] **App stores (if native app):** remove us as a developer from their Apple/Google accounts.
- [ ] **Google (Analytics/Search Console/Business Profile):** remove our user.

## 5. Hosting
- [ ] Either transfer the Vercel project and database to the client's own accounts, OR, after export and their confirmation, pause and later delete the project, database and n8n jobs (birthday, POS retry, monthly report, health).
- [ ] Remove the site from the builder panel registry and daily health digest.
- [ ] **Never** run blanket deletes on a shared database. Delete only this client's resources.

## 6. Close out
- [ ] Send a final written summary: what was exported, what was rotated, what was deleted, when.
- [ ] Keep a copy of the agreement, invoices and the summary for [3] years.
