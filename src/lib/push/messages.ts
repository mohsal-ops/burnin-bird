// Pure: what (if anything) to tell a customer when their order changes.
// Keep these short — they show on a lock screen.

export interface PushPayload {
  title: string;
  body: string;
  /** Page to open when tapped. */
  url: string;
  tag?: string;
}

/** Courier status (Uber vocabulary, also used for DoorDash) → customer message. */
export function courierMessage(status: string, restaurant: string, cartId: string): PushPayload | null {
  const url = "/";
  const tag = `order-${cartId}`;
  switch (status) {
    case "pickup_complete":
      return { title: "On the way 🚗", body: `Your ${restaurant} order has been picked up by the courier.`, url, tag };
    case "delivered":
      return { title: "Delivered", body: `Your ${restaurant} order was delivered. Enjoy!`, url, tag };
    case "canceled":
    case "returned":
      return { title: "Delivery problem", body: `There's a problem with your ${restaurant} delivery. The restaurant has been told.`, url, tag };
    default:
      return null; // pending / pickup: not worth a buzz
  }
}

/** Kitchen marked the order done. Pickup → "ready"; delivery waits for the courier. */
export function readyMessage(orderType: string, restaurant: string, cartId: string): PushPayload | null {
  if (orderType === "delivery") return null;
  return {
    title: "Your order is ready ✅",
    body: `Come pick it up at ${restaurant}.`,
    url: "/",
    tag: `order-${cartId}`,
  };
}

export function ownerNewOrderMessage(totalCents: number, orderType: string): PushPayload {
  return {
    title: `New order · $${(totalCents / 100).toFixed(2)}`,
    body: `${orderType === "delivery" ? "Delivery" : "Pickup"} order just came in.`,
    url: "/admin/orders",
    tag: "new-order",
  };
}
