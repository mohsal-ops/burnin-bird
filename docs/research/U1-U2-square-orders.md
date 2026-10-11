# U1 + U2: Square Orders API, externally paid orders, DELIVERY fulfillment

**Summary (read 2026-10-11):** U1 is CONFIRMED from official docs. An order paid on our site (Stripe) can be recorded in Square by creating the order with a fulfillment, then calling `CreatePayment` with `source_id: "EXTERNAL"` and `external_details` (`type: "OTHER"`, `source: "<our site name>"`), `autocomplete: false`, then `PayOrder`. Square says fully paid orders with fulfillments are pushed to Square Point of Sale and the Dashboard Order Manager. Square charges **1% per transaction** when the Orders API is used with a non-Square payment provider. KDS routing for EXTERNAL-paid orders is NOT stated in official docs (only implied via POS); treat as UNVERIFIED until a real-device test. U2 is PARTIALLY verified: the official overview lists DELIVERY as a supported fulfillment type with no stated restriction, but a Square developer-forum answer says DELIVERY fulfillments are limited to certified partners. Design: send delivery orders as PICKUP + a clear note, behind a capability flag, switchable to DELIVERY later.

## U1 details (official)
- External payments: "Set this field [`source_id`] to `EXTERNAL`." `external_details` (ExternalPaymentDetails): `type` (example `OTHER`), `source` (who took the payment), optional `source_fee_money`. "External payment proceeds aren't credited to the seller's Square account" (bookkeeping only).
  Source: https://developer.squareup.com/docs/payments-api/take-payments/external-payments
- To attach to an order: set `autocomplete: false` (payment stays `APPROVED`), then call Orders `PayOrder` with the payment id.
- Do NOT use the Payment tip fields for external vendors (they flow into the seller's tip pool). Put tips in `Order.service_charges` instead. (same page)
- "Every order that has fulfillment information is pushed to the Square Dashboard Order Manager when paid." and "Orders with fulfillment that have been fully paid are pushed to the Square Point of Sale and Square Dashboard Order Manager."
  Source: https://developer.squareup.com/docs/orders-api/what-it-does
- "If you want to use the Square Orders API with a non-Square payments provider, there is a 1% fee per transaction." (same page)
- Developer forum (not official): EXTERNAL payment must equal the full order total; a $0 payment on a priced order is rejected (`ORDER_TOTAL_MISMATCH`). Orders API orders print like Square Online orders, no special source needed.
  Source: https://developer.squareup.com/forums/t/orders-api-fulfillment-printing-detecting-merchant-print-settings-and-does-the-order-need-to-be-paid/28028

## U2 details
- Official overview: "The Orders API supports four types of fulfillment orders: Pickup, Shipment, Delivery, and In-store." No restriction stated.
- Forum (Square staff/community): DELIVERY fulfillments limited to certified partners; use PICKUP to denote deliveries. Not in official docs.

## Design decisions taken
1. Order flow: `CreateOrder` (idempotency_key = our order id) with PICKUP fulfillment → `CreatePayment` EXTERNAL for the exact `total_money` returned by Square, `autocomplete:false` → `PayOrder`.
2. Delivery orders: PICKUP fulfillment, `pickup_details.note` = "DELIVERY via <courier>, courier ETA HH:MM, customer <name>". `capabilities().supportsDeliveryFulfillment = false` until verified on a real account.
3. Tips go in `service_charges`, never Payment tip fields.
4. Owner must be told about the 1% Square fee (docs/pos/square.md + admin page copy).
5. Totals mismatch risk: Square computes its own tax. We send line items with `base_price_money` and let Square compute; if Square's total ≠ what we charged, we record the EXTERNAL payment for Square's total and add a note with our charged amount, and flag the sync row `accepted-with-mismatch` for the owner. (Avoids a rejected order = kitchen never sees it.)

## Still to verify on a real/sandbox account
- KDS + kitchen printer behavior for EXTERNAL-paid orders (scripts/square-sandbox-check.ts prints a checklist step for this).
- Whether DELIVERY fulfillment is accepted for our app.
