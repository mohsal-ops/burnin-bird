# Delivery router (flag `delivery_router`, OFF)

Off → `/api/cart/addDelivery` and `finalizeCart` run the original Uber-only code, byte-for-byte.
On → `routedQuote()` asks every enabled courier in parallel (8 s timeout each), keeps the cheapest (or fastest, admin setting), stores it on the cart (`uberQuoteId/uberFeeCents` + `deliveryProvider`). If one courier errors or times out, the other is used. If all fail, the customer sees the usual "delivery isn't available" and the reasons go to `uberQuoteError` (owner's Telegram on a paid order).
Dispatch: Uber carts → original Uber block; DoorDash carts → `dispatchRoutedDelivery()`; same failure behaviour (owner Telegram "arrange delivery manually").
