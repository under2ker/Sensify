import { test, expect } from "@playwright/test";

/** Одна строка NDJSON как при stream: true — без вызова реальных AI. */
function mockExtractNdjsonBody() {
  const payload = {
    t: "result",
    r: {
      title: "E2E Mock Title",
      summary: "Тестовое резюме для Playwright.",
      keyIdeas: ["Идея для проверки UI"],
      flashcards: [],
      structuredNotes: "## Заметки\n\nПункт проверки.",
      tags: ["e2e"],
      language: "ru",
    },
    source: "Вставленный текст",
    extractedLinks: [],
  };
  return `${JSON.stringify(payload)}\n`;
}

test.describe("Extract (smoke)", () => {
  test("форма извлечения видна и доступна", async ({ page }) => {
    await page.goto("/");
    // Поле ввода URL/текста
    const input = page.getByRole("textbox").or(page.getByPlaceholder(/url|вставьте|ссылка|текст/i));
    await expect(input.first()).toBeVisible({ timeout: 5000 });
    // Кнопка извлечения
    const extractBtn = page.getByRole("button", { name: /извлечь|извлечение/i });
    await expect(extractBtn.first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Extract (mock API)", () => {
  test("вкладка Текст + мок POST /api/extract → заголовок результата", async ({ page }) => {
    await page.route("**/api/extract", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/x-ndjson" },
        body: mockExtractNdjsonBody(),
      });
    });

    await page.goto("/");
    await page.getByRole("tab", { name: "Текст" }).click();
    await page.getByPlaceholder(/Вставьте статью|из которого хотите извлечь/i).fill("x".repeat(60));
    await page.getByRole("button", { name: "Извлечь смысл" }).click();

    await expect(page.getByRole("heading", { name: "E2E Mock Title" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Тестовое резюме для Playwright.", { exact: false })).toBeVisible();
  });
});
