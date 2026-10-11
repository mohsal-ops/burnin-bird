// Provider-neutral POS types. Adapters translate these to/from each POS API.
// Money is always integer cents, USD.

export type PosProvider = "square" | "clover" | "toast" | "lightspeed_k" | "shift4";
export type PosEnvironment = "sandbox" | "production";

export interface PosCreds {
  accessToken: string;
  refreshToken?: string;
  /** ISO timestamp the access token expires (if the POS tells us). */
  expiresAt?: string;
}

/** What an adapter needs to talk to one restaurant's POS. */
export interface PosContext {
  environment: PosEnvironment;
  merchantId?: string | null;
  locationId?: string | null;
  creds: PosCreds;
}

export interface PosOrderModifier {
  name: string;
  /** Price of the modifier already included in the line's unitPriceCents. */
  priceCents: number;
}

export interface PosOrderLine {
  name: string;
  quantity: number;
  /** Unit price the customer paid, modifiers included. */
  unitPriceCents: number;
  modifiers: PosOrderModifier[];
}

export interface PosOrderInput {
  /** Our order id (Cart.id). Used as the idempotency key / reference. */
  externalId: string;
  lines: PosOrderLine[];
  customer: { name?: string; phone?: string; email?: string };
  fulfillment: {
    type: "pickup" | "delivery";
    /** ISO time for scheduled pickup; undefined = ASAP. */
    pickupAt?: string;
    /** Restaurant's IANA timezone, for human-readable times on tickets. */
    timezone: string;
    deliveryAddress?: string;
    note?: string;
  };
  discountCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  /** What the customer was charged (Stripe), tip excluded. */
  totalCents: number;
}

export interface PosOrderResult {
  posOrderId: string;
  /** Total the POS computed — compared with ours to catch mismatches. */
  posTotalCents?: number;
}

export interface PosMenuModifier {
  posId: string;
  name: string;
  priceCents: number;
}
export interface PosMenuModifierGroup {
  posId: string;
  name: string;
  required: boolean;
  maxSelect: number | null;
  modifiers: PosMenuModifier[];
}
export interface PosMenuItem {
  /** Id of the sellable thing (Square ITEM_VARIATION, Clover item). */
  posId: string;
  name: string;
  description?: string;
  priceCents: number;
  available: boolean;
  category: string;
  modifierGroups: PosMenuModifierGroup[];
}
export interface PosMenu {
  items: PosMenuItem[];
}

export interface PosLocation {
  id: string;
  name: string;
}

export interface PosAdapter {
  provider: PosProvider;
  /** Human status shown in admin; scaffolds say what's blocking them. */
  support: "built" | "built_needs_approval" | "scaffold";
  authorizeUrl(opts: { environment: PosEnvironment; state: string; redirectUri: string }): string;
  exchangeCode(opts: {
    environment: PosEnvironment;
    code: string;
    redirectUri: string;
    /** Some POSes (Clover) send the merchant id on the redirect. */
    merchantId?: string;
  }): Promise<{ creds: PosCreds; merchantId?: string }>;
  refresh?(environment: PosEnvironment, creds: PosCreds): Promise<PosCreds>;
  listLocations(ctx: PosContext): Promise<PosLocation[]>;
  importMenu(ctx: PosContext): Promise<PosMenu>;
  pushOrder(ctx: PosContext, order: PosOrderInput, hooks?: PushHooks): Promise<PosOrderResult>;
}

/**
 * For POSes without idempotency keys (Clover): the pipeline persists the POS
 * order id as soon as it exists, and passes it back on a retry so a failure
 * after creation never makes a second ticket.
 */
export interface PushHooks {
  existingPosOrderId?: string | null;
  onCreated?(posOrderId: string): Promise<void>;
}

/** Thrown by adapters. `retryable` = worth trying again later (5xx, 429, network). */
export class PosError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PosError";
  }
}
