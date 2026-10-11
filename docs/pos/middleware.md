# POS middleware option (for Toast, Lightspeed, Shift4, others)

Aggregators already hold partner access to many POS systems and expose one API for "inject this online order into the POS":
- **Deliverect**, **Otter**, **Chowly**, **Cuboh**, **ItsaCheckmate** (names only; pricing and coverage change — verify before quoting a client).

How it would plug in: one more adapter (`middleware`) implementing `PosAdapter.pushOrder` against the aggregator's order-injection API. The restaurant pays the aggregator's monthly fee (typically tens of dollars/month — confirm current price), so offer it only when a client on Toast/Lightspeed/Shift4 insists on tickets in their POS.

Default advice for those clients today: orders arrive by email + Telegram + the kitchen alarm in admin → Orders (no POS needed).

Status: not built. Decision recorded in docs/DECISIONS.md.
