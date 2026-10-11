import { vi } from "vitest";
import type { PosOrderInput } from "@/lib/pos/types";

export type Call = { url: string; method: string; body: unknown; headers: Record<string, string> };

/** Replace global fetch with a router of canned responses; records every call. */
export function mockFetch(routes: [RegExp, (call: Call) => { status?: number; json: unknown }][]) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const call: Call = {
        url,
        method: init.method ?? "GET",
        body: init.body ? JSON.parse(String(init.body)) : undefined,
        headers: (init.headers ?? {}) as Record<string, string>,
      };
      calls.push(call);
      const r = routes.find(([re]) => re.test(`${call.method} ${url}`));
      if (!r) return new Response(JSON.stringify({ message: `no mock for ${call.method} ${url}` }), { status: 404 });
      const out = r[1](call);
      return new Response(JSON.stringify(out.json), { status: out.status ?? 200 });
    }),
  );
  return calls;
}

export const sampleOrder = (over: Partial<PosOrderInput> = {}): PosOrderInput => ({
  externalId: "cart_test_123",
  lines: [
    { name: "Smash Burger", quantity: 2, unitPriceCents: 1149, modifiers: [{ name: "Bacon", priceCents: 150 }] },
    { name: "Fries", quantity: 1, unitPriceCents: 399, modifiers: [] },
  ],
  customer: { name: "Test Customer", phone: "+15550000000", email: "test@example.com" },
  fulfillment: { type: "pickup", pickupAt: "2030-01-01T18:30:00.000Z", timezone: "America/New_York" },
  discountCents: 0,
  deliveryFeeCents: 0,
  tipCents: 0,
  totalCents: 2 * 1149 + 399,
  ...over,
});
