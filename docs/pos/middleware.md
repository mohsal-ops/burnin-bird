# POS middleware option (Deliverect / Otter / OrderOut). Researched 2026-10-11, NOT integrated

Middleware companies already hold partner access to many POS systems. They inject "outside" orders into the POS so they print like normal tickets. For a POS we don't build natively (Toast, Lightspeed K, Shift4, others), the restaurant could subscribe to one, and we'd send orders to the middleware instead of to the POS.

| | Deliverect | Otter | OrderOut |
|---|---|---|---|
| What it is | Order-management hub (marketplaces + web orders → POS) | Order aggregation + its own POS/KDS | Order injection into POS, focused on small restaurants |
| POS coverage (public) | Wide: names Toast, Lightspeed, Square, Oracle Simphony, Aloha and more; varies by country | Partial / via partners; also sells its own POS (so "integration" can mean replacing the POS) | Clover and Square today; Toast "coming soon" |
| Public price | None. Quote-based. 1–2 location restaurants are served only through regional resellers | Conflicting third-party figures (about $19 to $289+/mo, plus per-order fees, add-ons, and a possible 24-month term). Get a written quote | Free plan (1 location, Clover/Square); Essential $89.99/mo; integrator pricing by quote with revenue share |
| API for us | Partner programme | Via an Otter account rep | Integration API after intro call + approval |

All prices are as listed publicly on 2026-10-11 and **must be verified** before quoting a client.

## Recommendation
- **Square / Clover restaurants:** use our native adapters (built, pending sandbox + real-client test). No middleware needed.
- **Toast / Lightspeed K / Shift4:** default answer is our email + Telegram + kitchen alarm + owner push alerts (no POS ticket). If the owner insists on tickets in the POS, the realistic route is **Deliverect** (widest coverage) at the restaurant's own cost. We'd build a `middleware` adapter only **after the client has signed and paid a deposit**.
- Don't build OrderOut (it only covers POSes we already support natively). Don't lead with Otter (it competes as a POS).

## Sources
- Deliverect FAQ (pricing factors; 1–2 location brands via resellers): https://deliverect.com/en/faq
- Deliverect pricing page: https://website-prod-assets.deliverect.com/en/pricing
- OrderOut pricing: https://www.orderout.co/pricing/ · integrators: https://www.orderout.co/integrators/ · FAQ: https://www.orderout.co/faq/
- Otter third-party pricing summaries: https://pricingsaas.com/companies/tryotter · https://apis.io/plans/otter/otter-plans-pricing/ · https://www.capterra.com/p/275512/Hubster/
