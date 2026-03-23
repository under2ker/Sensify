import { test, expect } from "@playwright/test";

test.describe("Страница премиум", () => {
  test("загружается и отображает тарифы", async ({ page }) => {
    await page.goto("/premium");
    await expect(page.getByText(/премиум|тариф|подписк/i)).toBeVisible({ timeout: 5000 });
  });

  test("есть кнопки оплаты", async ({ page }) => {
    await page.goto("/premium");
    await expect(page.getByRole("button", { name: /оплат|оформить|купить/i })).toBeVisible({ timeout: 5000 });
  });
});
