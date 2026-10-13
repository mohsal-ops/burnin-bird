import { describe, expect, it, beforeAll, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

let auth: typeof import("../src/lib/customerAuth");
beforeAll(async () => {
  process.env.ADMIN_SECRET = "test-secret-for-customer-auth";
  auth = await import("../src/lib/customerAuth");
});

describe("customer sign-in codes", () => {
  it("accepts the right code and rejects a wrong one", () => {
    const { code, challenge } = auth.newChallenge("sam@example.com");
    expect(code).toMatch(/^\d{6}$/);
    expect(auth.checkChallenge(challenge, code)).toBe("sam@example.com");
    const wrong = code === "000000" ? "111111" : "000000";
    expect(auth.checkChallenge(challenge, wrong)).toBeNull();
  });

  it("rejects an expired code", () => {
    const { code, challenge } = auth.newChallenge("sam@example.com");
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now + 11 * 60_000);
    expect(auth.checkChallenge(challenge, code)).toBeNull();
    vi.restoreAllMocks();
  });

  it("rejects a challenge edited to another email", () => {
    const { code, challenge } = auth.newChallenge("sam@example.com");
    const [p, sig] = challenge.split(".");
    const forged = Buffer.from(Buffer.from(p, "base64url").toString().replace("sam@", "eve@")).toString("base64url");
    expect(auth.checkChallenge(`${forged}.${sig}`, code)).toBeNull();
  });
});

describe("customer session cookie", () => {
  it("round-trips and can't be forged", () => {
    const t = auth.sessionToken("sam@example.com");
    expect(auth.readSession(t)).toBe("sam@example.com");
    const [p] = t.split(".");
    expect(auth.readSession(`${p}.not-the-signature`)).toBeNull();
    expect(auth.readSession(undefined)).toBeNull();
  });

  it("normalizes emails and refuses junk", () => {
    expect(auth.normalizeEmail("  Sam@Example.COM ")).toBe("sam@example.com");
    expect(auth.normalizeEmail("not-an-email")).toBeNull();
    expect(auth.normalizeEmail(42)).toBeNull();
  });
});
