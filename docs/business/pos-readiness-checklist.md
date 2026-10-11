# POS readiness checklist (BEFORE promising a POS link)

Southern Jerks left partly because their POS link (Shift4) never happened. Never promise a POS connection until every box below is ticked and written into the SOW.

## 1. Which POS, exactly?
- [ ] Brand **and product line**. "Lightspeed" can mean X-Series, R-Series or K-Series, and only K-Series is the restaurant one, which is gated. "Shift4" can be SkyTab / Shift4 Dine.
- [ ] Plan/subscription level (Toast standard API access needs RMS Essentials or higher).
- [ ] How many locations, and does each have its own POS account/location ID?

## 2. Can we even connect?
| POS | Our status | What it takes |
|---|---|---|
| Square | Built, needs a real-client test | Owner signs in with Square once (OAuth). |
| Clover | Built, needs Clover app approval + a real-client test | Owner installs our app; Clover must approve the app first. |
| Toast | Not available | Toast partner access, or credentials created by a staff member with **Manage Integrations**. Order writes need partner approval. |
| Lightspeed K-Series | Not available | Approved Lightspeed partner app. |
| Shift4 / SkyTab | Not available | Shift4 Marketplace listing. |
| Other | Not available | Ask whether a middleware (Deliverect) covers it, at the restaurant's cost. |

## 3. Questions to ask the restaurant
- [ ] **Who at your POS company must approve a third party?** Get the rep's name and email.
- [ ] Who on your staff has admin rights to install apps or create API credentials?
- [ ] Do you want orders to **print** in the kitchen, show on a **kitchen screen**, or both?
- [ ] Do you want **menu and prices** to come from the POS (the POS becomes the source of truth)?
- [ ] Is your menu in the POS complete, with modifiers set up? (A messy POS menu means a messy website menu.)
- [ ] Taxes and tips: are they set up in the POS? (Orders arrive as "paid online"; the totals must match.)

## 4. Realistic timeline to tell them
| Situation | Honest timeline |
|---|---|
| Square, owner can sign in | 1–3 days after their website is live (plus our first real-client test) |
| Clover, after our app is approved | about 1 week |
| Clover, before approval | weeks (depends on Clover review) |
| Toast / Lightspeed K / Shift4 | **months, if ever.** Depends on the POS company approving us. Don't sell it. |

## 5. What to put in the SOW
- [ ] Exact POS + product line, and what "done" means (e.g. "a paid website order prints on the Clover kitchen printer").
- [ ] What happens if the POS company doesn't approve us: that batch is refunded or swapped. The rest of the site still works, and orders still arrive by email, Telegram and the kitchen alarm.
- [ ] "BUILD ONLY AFTER A CLIENT HAS SIGNED AND PAID A DEPOSIT" for any POS we haven't built yet.
