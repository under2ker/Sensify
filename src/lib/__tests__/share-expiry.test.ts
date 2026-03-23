import { describe, it, expect } from "vitest";
import { parseShareExpiresInDays, expiresAtFromDays } from "@/lib/share-expiry";

describe("share-expiry", () => {
  it("parse nullish and never", () => {
    expect(parseShareExpiresInDays(null)).toBeNull();
    expect(parseShareExpiresInDays(undefined)).toBeNull();
    expect(parseShareExpiresInDays("never")).toBeNull();
    expect(parseShareExpiresInDays("")).toBeNull();
  });

  it("parse allowed day counts", () => {
    expect(parseShareExpiresInDays(7)).toBe(7);
    expect(parseShareExpiresInDays(30)).toBe(30);
    expect(parseShareExpiresInDays(365)).toBe(365);
    expect(parseShareExpiresInDays("30")).toBe(30);
  });

  it("parse rejects invalid", () => {
    expect(parseShareExpiresInDays(9)).toBeNull();
    expect(parseShareExpiresInDays(0)).toBeNull();
    expect(parseShareExpiresInDays("x")).toBeNull();
    expect(parseShareExpiresInDays(999)).toBeNull();
  });

  it("expiresAtFromDays adds UTC days", () => {
    const before = Date.now();
    const d = expiresAtFromDays(7);
    expect(d).not.toBeNull();
    const diff = d!.getTime() - before;
    expect(diff).toBeGreaterThan(6 * 86_400_000);
    expect(diff).toBeLessThan(8 * 86_400_000);
  });

  it("expiresAtFromDays null", () => {
    expect(expiresAtFromDays(null)).toBeNull();
  });
});
