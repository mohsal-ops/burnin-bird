import { describe, expect, it } from "vitest";
import { pickQuote, quoteAll } from "@/lib/delivery/router";
import type { DeliveryProvider, DeliveryQuote } from "@/lib/delivery/types";

const q = (provider: DeliveryQuote["provider"], feeCents: number, etaMinutes?: number): DeliveryQuote => ({
  provider, ref: provider, feeCents, etaMinutes,
});
const fake = (id: DeliveryQuote["provider"], quote: () => Promise<DeliveryQuote>): DeliveryProvider => ({
  id, label: id, isConfigured: async () => true, quote, dispatch: async () => ({ deliveryId: "", status: "pending" }),
});
const input = {
  externalId: "c",
  pickup: { formatted: "a", businessName: "b", phone: "+1" },
  dropoff: { formatted: "d" },
  orderValueCents: 1000,
};

describe("pickQuote", () => {
  it("cheapest wins, ETA breaks ties", () => {
    expect(pickQuote([q("uber_direct", 899, 30), q("doordash_drive", 799, 45)], "cheapest")?.provider).toBe("doordash_drive");
    expect(pickQuote([q("uber_direct", 799, 25), q("doordash_drive", 799, 45)], "cheapest")?.provider).toBe("uber_direct");
  });
  it("fastest wins, unknown ETA goes last", () => {
    expect(pickQuote([q("uber_direct", 899, 30), q("doordash_drive", 799, 45)], "fastest")?.provider).toBe("uber_direct");
    expect(pickQuote([q("uber_direct", 500), q("doordash_drive", 799, 45)], "fastest")?.provider).toBe("doordash_drive");
  });
  it("no quotes → null", () => expect(pickQuote([], "cheapest")).toBeNull());
});

describe("quoteAll", () => {
  it("falls back to the provider that works when the other errors", async () => {
    const r = await quoteAll(
      [fake("uber_direct", async () => { throw new Error("address out of range"); }), fake("doordash_drive", async () => q("doordash_drive", 900))],
      input,
      "cheapest",
    );
    expect(r.chosen?.provider).toBe("doordash_drive");
    expect(r.errors).toEqual([{ provider: "uber_direct", message: "address out of range" }]);
  });

  it("a hung provider times out instead of blocking checkout", async () => {
    const r = await quoteAll(
      [fake("uber_direct", () => new Promise(() => {})), fake("doordash_drive", async () => q("doordash_drive", 900))],
      input,
      "cheapest",
      50,
    );
    expect(r.chosen?.provider).toBe("doordash_drive");
    expect(r.errors[0].message).toMatch(/timed out/);
  });

  it("all fail → no choice, every reason kept", async () => {
    const r = await quoteAll([fake("uber_direct", async () => { throw new Error("x"); })], input, "cheapest");
    expect(r.chosen).toBeNull();
    expect(r.errors).toHaveLength(1);
  });
});
