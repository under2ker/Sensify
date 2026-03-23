# Производительность и оптимизации Sensify

Краткий конспект решений и ограничений. Детальная история — [`PROJECT_HISTORY_TREE.md`](./PROJECT_HISTORY_TREE.md).

## Клиент (React / Next.js)

| Мера | Зачем |
|------|--------|
| **`useShallow` (zustand)** в крупных компонентах | Меньше лишних ререндеров при изменении несвязанных полей стора. |
| **Отдельные селекторы** там, где важно одно поле (напр. `ThemeToggle` → только `theme`) | Подписка только на нужный кусок состояния. |
| **`next/dynamic` для `SettingsDialog`** | Тяжёлый диалог не попадает в первый бандл главной — грузится при первом открытии. |
| **Dynamic `OutputPanel` / `ExportPanel` / `HistorySidebar` на `/`** | Первый чанк без тяжёлого вывода, экспорта и сайдбара; скелетон у панелей результата/экспорта. |
| **`LazyMarkdownPreview` (`dynamic` → `react-markdown`)** | Библиотека markdown только при включении превью в редакторе блока. |
| **`React.memo` в `OutputPanel`** | `FlashcardItem`, `CopyButton`, `SourceFavicon` — реже перерисовка длинных списков. |
| **`experimental.optimizePackageImports`** (`lucide-react`, `framer-motion`) | Tree-shaking иконок и модулей motion без ручного `import { Icon }`. |
| **Динамический `import("pdf-lib")` в `buildExtractionPdf`** | PDF-библиотека только при экспорте PDF. |
| **Кэш шрифта Roboto** (`fontBytesCache` в PDF) | Повторные PDF без повторной загрузки TTF. |

## Сервер (API)

| Мера | Зачем |
|------|--------|
| **Burst rate limit на `POST /api/extract`** | Защита от всплесков поверх дневных лимитов; in-memory на инстанс. |
| **Лимиты на `verify-groq` / `verify-gemini`** | Ограничение злоупотребления проверкой ключей. |
| **Ранний `assertUrlSafeForFetch`** в extract | Не тянем контент по опасным URL. |

### Распределённый лимит (Upstash)

В **`src/lib/distributed-rate-limit.ts`**: при **`UPSTASH_REDIS_REST_URL`** и **`UPSTASH_REDIS_REST_TOKEN`** burst на `POST /api/extract` и лимиты `verify-groq` / `verify-gemini` идут через **Upstash Redis** (скользящее окно) и совпадают между инстансами. Без этих переменных используется in-memory fallback (см. `memory-rate-limit.ts`).

### Ограничения in-memory (если Upstash не задан)

На **одном процессе** счётчики общие; при **нескольких инстансах** без Upstash лимит **не** глобальный. Общая БД вместо локального SQLite — [`DATABASE_PRODUCTION.md`](./DATABASE_PRODUCTION.md); указатель — [`PLANNED_FEATURES.md`](./PLANNED_FEATURES.md).

## Lighthouse CI

- Конфиг: **`lighthouserc.cjs`**; скрипт: **`npm run lighthouse:ci`** (после `npm run build` поднимает `npm run start` и проверяет `/` и `/about`).
- В **GitHub Actions** job `lighthouse` в `.github/workflows/ci.yml`: пороги **accessibility** и **best-practices** ≥ **0.85** (error); **SEO** и **performance** — warn (perf на cold start в CI часто занижен).

## Идеи на будущее

- Ленивый `react-markdown` для **вкладок вывода** (резюме/заметки) при первом показе — ещё один отдельный чанк.
- Сегментация маршрутов (отдельные layout для `/admin`, `/profile`).
- Web Vitals / field data (RUM) в проде.
