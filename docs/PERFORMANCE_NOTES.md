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

### Ограничения in-memory лимитов

На **одном процессе** счётчики общие; при **нескольких инстансах** (Vercel, k8s) лимит не глобальный — для продакшена смотрите Redis / Upstash / Vercel KV (см. [`PLANNED_FEATURES.md`](./PLANNED_FEATURES.md)). Общая БД вместо SQLite на диске — [`DATABASE_PRODUCTION.md`](./DATABASE_PRODUCTION.md).

## Идеи на будущее

- Ленивый `react-markdown` для **вкладок вывода** (резюме/заметки) при первом показе — ещё один отдельный чанк.
- Сегментация маршрутов (отдельные layout для `/admin`, `/profile`).
- Lighthouse / Web Vitals в CI.
