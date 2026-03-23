import { test, expect } from "@playwright/test";

test.describe("SEO маршруты", () => {
  test("sitemap.xml и robots.txt отдаются", async ({ request }) => {
    const sm = await request.get("/sitemap.xml");
    expect(sm.ok()).toBeTruthy();
    const smText = await sm.text();
    expect(smText).toContain("<urlset");
    expect(smText).toContain("<loc>");

    const rb = await request.get("/robots.txt");
    expect(rb.ok()).toBeTruthy();
    const rbText = await rb.text();
    expect(rbText.toLowerCase()).toContain("user-agent");
    expect(rbText).toMatch(/sitemap:\s*https?:\/\//i);
  });
});
