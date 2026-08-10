// A CartItem's own `orderType` field is often left unset by older client flows,
// so delivery-address presence is the more reliable signal for pickup vs delivery.
// Shared (not a server action) so both the orders server actions and the admin
// dashboard client component can use it.
export function deriveOrderType(item: { deliveryAddress: string | null; orderType: string | null }) {
  if (item.deliveryAddress) return "delivery";
  if (item.orderType === "delivery") return "delivery";
  return "pickup";
}
