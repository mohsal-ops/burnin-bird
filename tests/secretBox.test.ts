import { beforeEach, describe, expect, it } from "vitest";
import { decryptJson, encryptJson, maskPhone, maskSecret } from "@/lib/secretBox";

describe("secretBox", () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = "test-secret-not-real";
  });

  it("round-trips JSON", () => {
    const enc = encryptJson("pos-creds", { accessToken: "abc", n: 1 });
    expect(enc.startsWith("v1:")).toBe(true);
    expect(enc).not.toContain("abc");
    expect(decryptJson("pos-creds", enc)).toEqual({ accessToken: "abc", n: 1 });
  });

  it("cannot decrypt across domains", () => {
    const enc = encryptJson("pos-creds", { a: 1 });
    expect(decryptJson("delivery-creds", enc)).toBeNull();
  });

  it("returns null when ADMIN_SECRET changed", () => {
    const enc = encryptJson("pos-creds", { a: 1 });
    process.env.ADMIN_SECRET = "rotated";
    expect(decryptJson("pos-creds", enc)).toBeNull();
  });

  it("masks secrets and phones", () => {
    expect(maskSecret("sq0atp-1234567890abcd")).toBe("sq0atp****abcd");
    expect(maskPhone("+15551234567")).toBe("+1******4567");
  });
});
