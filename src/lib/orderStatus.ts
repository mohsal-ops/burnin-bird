// A cart's lifecycle. Kept in one place so the kitchen view, the finalize path,
// and the revenue stats all agree on what each status means:
//
//   "open"      - the customer is still building the cart (UNPAID). Auto-cleaned
//                 to "abandoned" by /api/cart/cleanup. Never a real order.
//   "new"       - PAID and waiting on the kitchen. This is a real order that just
//                 came in - what the new-order alarm fires on.
//   "completed" - the kitchen has fulfilled it (owner tapped "Mark Completed").
//   "abandoned" - cleared / never paid.
//
// Both "new" and "completed" are PAID orders, so both count toward revenue and
// stats. (Historically finalize set paid carts straight to "completed"; the "new"
// state was added so a fresh paid order is visibly distinct from a finished one
// and can trigger the kitchen alarm.)

export type CartStatus = "open" | "new" | "completed" | "abandoned";

export const NEW_ORDER: CartStatus = "new";

// Statuses that represent a real, paid order.
export const PAID_STATUSES = ["new", "completed"] as const;

export function isPaid(status: string | null | undefined): boolean {
  return status === "new" || status === "completed";
}
