import { test, expect } from "@playwright/test";

test.describe("Health API", () => {
  test("GET /api/health — ok, database, databaseBackend, rateLimitDistributed, paymentsConfigured", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect([200, 503]).toContain(res.status());
    const json = (await res.json()) as {
      ok: boolean;
      database?: string;
      databaseBackend?: string;
      rateLimitDistributed?: boolean;
      paymentsConfigured?: boolean;
      timestamp?: string;
    };
    expect(typeof json.ok).toBe("boolean");
    expect(json).toHaveProperty("paymentsConfigured");
    expect(typeof json.paymentsConfigured).toBe("boolean");
    expect(json.databaseBackend).toMatch(/^(turso|sqlite)$/);
    expect(typeof json.rateLimitDistributed).toBe("boolean");
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    if (res.status() === 200) {
      expect(json.database).toBe("ok");
    }
  });
});
