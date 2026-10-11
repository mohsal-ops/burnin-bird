// Provider-neutral courier delivery. Uber Direct and DoorDash Drive implement
// DeliveryProvider; the router (router.ts) asks every enabled provider for a
// quote and picks one. Money = integer cents (USD).

export type DeliveryProviderId = "uber_direct" | "doordash_drive";

export interface DeliveryAddress {
  formatted: string;
  lat?: number | null;
  lng?: number | null;
}

export interface QuoteInput {
  /** Our cart id — DoorDash uses it as external_delivery_id. */
  externalId: string;
  pickup: DeliveryAddress & { businessName: string; phone: string };
  dropoff: DeliveryAddress & { name?: string; phone?: string };
  orderValueCents: number;
}

export interface DeliveryQuote {
  provider: DeliveryProviderId;
  /** Uber quote id / DoorDash external_delivery_id. */
  ref: string;
  feeCents: number;
  etaMinutes?: number;
  /** ISO time after which the quote can't be accepted. */
  expiresAt?: string;
}

export interface DispatchInput {
  quote: DeliveryQuote;
  externalId: string;
  pickup: DeliveryAddress & { businessName: string; phone: string; notes?: string };
  dropoff: DeliveryAddress & { name: string; phone: string; notes?: string };
  items: { name: string; quantity: number }[];
  orderValueCents: number;
  /** Site URL, so a central webhook can route status back (Uber). */
  siteUrl: string;
}

export interface DispatchResult {
  deliveryId: string;
  /** Normalised to the Uber vocabulary used across the app:
   *  pending | pickup | pickup_complete | dropoff | delivered | canceled | returned */
  status: string;
  trackingUrl?: string;
  feeCents?: number;
}

export interface DeliveryProvider {
  id: DeliveryProviderId;
  label: string;
  isConfigured(): Promise<boolean>;
  quote(input: QuoteInput): Promise<DeliveryQuote>;
  dispatch(input: DispatchInput): Promise<DispatchResult>;
}
