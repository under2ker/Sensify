import { test, expect } from "@playwright/test";

test.describe("Клавиатура (a11y)", () => {
  test("/login: Tab до полей формы и переход email → password", async ({ page }) => {
    await page.goto("/login");
    const email = page.locator('input[type="email"]');
    const password = page.locator('input[type="password"]');

    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      if (await email.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(email).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(password).toBeFocused();
  });
});
