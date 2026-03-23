/**
 * Lighthouse CI — см. docs/PERFORMANCE_NOTES.md, docs/PLANNED_FEATURES.md.
 * Запуск: после `npm run build` — `npm run lighthouse:ci` (сервер поднимает LHCI).
 */
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready",
      url: ["http://localhost:3000/", "http://localhost:3000/about", "http://localhost:3000/developers"],
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
        // В CI путь задаётся через LHCI_COLLECT__SETTINGS__CHROME_PATH (см. workflow)
        ...(process.env.LHCI_CHROME_PATH
          ? { chromePath: process.env.LHCI_CHROME_PATH }
          : {}),
      },
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.85 }],
        "categories:best-practices": ["error", { minScore: 0.85 }],
        "categories:seo": ["warn", { minScore: 0.85 }],
        /** На cold start в CI perf часто ниже; цель продукта — ≥85 вручную / field data */
        "categories:performance": ["warn", { minScore: 0.65 }],
      },
    },
  },
};
