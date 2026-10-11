# Qualifying a lead by POS (one question)

**Ask:** "What do you use to ring up orders in the restaurant?"

Then use the table. Say only what's in the "What to say" column.

| POS | Status | What to say | What NOT to say |
|---|---|---|---|
| **Square** | **Soon** (built, waiting for a first real restaurant test) | "We're finishing a Square connection. Your website orders can show up in Square as paid tickets. You could be one of the first. Until then, every order reaches you by text, email and a kitchen alarm." | "We work with Square" (not until a real restaurant runs it). |
| **Clover** | **Soon** (built, needs Clover's approval + a real test) | "We've built a Clover connection and are waiting on Clover's approval. Meanwhile orders come to you by text, email and a kitchen alarm." | Any date. Clover controls the approval. |
| **Toast** | **Not offered** | "We don't connect to Toast. Toast only lets its own partners send orders in. You'd get orders by text, email and a kitchen screen instead. Many owners are fine with that." | "We integrate with Toast." "Coming soon." |
| **Lightspeed (K-Series)** | **Not offered** | Same as Toast. | Same as Toast. |
| **Shift4 / SkyTab** | **Not offered** | "Shift4 connections go through their marketplace, which takes months. Orders reach you by text, email and the kitchen alarm instead." | Any promise of a Shift4 link (this is what lost us Southern Jerks). |
| **Other / paper / iPad only** | **Fine** | "No problem. Orders come to your phone and a kitchen screen." | — |

## Rules
1. A POS is only "supported" after a real restaurant has used it end to end and `lib/features.ts` on the landing page says `live`.
2. Never put a POS link in a quote for a POS marked "Not offered". If they insist, see `docs/pos/middleware.md` (Deliverect, at their cost) and only after a signed SOW and deposit.
3. If the POS link is the deal-breaker for a "Not offered" POS, walk away politely. It's better than losing them later.
