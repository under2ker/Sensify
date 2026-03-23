# Запланированные доработки

**Сводка сделано / не сделано:** [`STATUS.md`](./STATUS.md).

Краткий указатель; детали и чеклисты — в **`TZ_SENSIFY_FUNCTIONALITY.md`**, **`DESIGN_CHECKLIST.md`**, **`NICHE_DEVELOPERS_TRANSITION_PLAN.md`**.

## Инфраструктура

- БД: **runtime Turso** — `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` + `create-prisma-client.ts`; пошагово — **`docs/DATABASE_PRODUCTION.md`**
- Rate limiting: **Upstash Redis** при `UPSTASH_*` — `distributed-rate-limit.ts` (extract burst, verify-*); иначе in-memory — `docs/PERFORMANCE_NOTES.md`
- Docker / деплой — см. README

## Продукт

- Экспорт: Notion **child page по API** — v1.8.7 (`docs/NOTION_EXPORT.md`); **database** с кастомными полями — позже. PDF — v1.8.6.
- Sidebar: Recent / Saved / Trash (локально) + вкладка **«Ссылки»** (публичные шары авторизованного пользователя, `GET /api/user/shares`); синк списка между устройствами — позже
- Сохранённые пользовательские пресеты — браузер + **`GET`/`PUT` `/api/user/presets`** и таблица `user_presets` (слияние при входе); при необходимости — конфликты по версии / ручной выбор источника
- Admin: журнал платежей — **v1.9.3** (`PaymentLog`, webhook ЮKassa, `/api/admin/payments`, блок в админке); см. также `docs/YOOKASSA_PAYMENTS.md`
- Уведомления: **колокол в шапке главной** (v1 — пустое меню; push/сервер — позже)

## Качество

- E2E (Playwright) — главная, вход, публичные страницы, `health.spec.ts`, **`extract.spec.ts`**, **`a11y-keyboard.spec.ts`** (`/login`); в **CI** job `e2e` (см. `.github/workflows/ci.yml`)
- A11Y: контраст `muted-foreground`, skip-link, `aria-live`; keyboard — см. e2e выше; дальше — полный WCAG AA обход
- Lighthouse: **`lighthouse:ci`** + job **`lighthouse`** в CI (a11y/best-practices ≥ 0.85; perf в CI — warn)

## Маркетинг / ниша (ongoing)

- См. **фаза 5** в `NICHE_DEVELOPERS_TRANSITION_PLAN.md` (контент в соцсетях / PH). Страница **`/developers`** — webhook, экспорт, Ollama, health; ссылки в шапке главной и в футере.
- **SEO:** `sitemap.xml`, `robots.txt` (`src/app/sitemap.ts`, `robots.ts`), база **`NEXT_PUBLIC_SITE_URL`** / `getCanonicalSiteUrl()`; E2E `e2e/seo.spec.ts`.
