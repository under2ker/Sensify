# Запланированные доработки

**Сводка сделано / не сделано:** [`STATUS.md`](./STATUS.md).

Краткий указатель; детали и чеклисты — в **`TZ_SENSIFY_FUNCTIONALITY.md`**, **`DESIGN_CHECKLIST.md`**, **`NICHE_DEVELOPERS_TRANSITION_PLAN.md`**.

## Инфраструктура

- БД: миграция с SQLite на облачную — см. **`docs/DATABASE_PRODUCTION.md`** (Turso и др.)
- Rate limiting для публичных API — частично: `verify-groq` / `verify-gemini`, **burst** на `POST /api/extract` (in-memory, один инстанс); кластерный лимит — Redis / KV (см. `docs/PERFORMANCE_NOTES.md`)
- Docker / деплой — см. README

## Продукт

- Экспорт: Notion **child page по API** — v1.8.7 (`docs/NOTION_EXPORT.md`); **database** с кастомными полями — позже. PDF — v1.8.6.
- Sidebar: табы Recent / Saved / Trash (локально); Shared + синк — при появлении backend
- Сохранённые пользовательские пресеты — **локально в браузере** (панель ввода, v1.9.1); синхронизация с аккаунтом — позже
- Admin: журнал платежей — **v1.9.3** (`PaymentLog`, webhook ЮKassa, `/api/admin/payments`, блок в админке)
- Уведомления (колокол в header) — опционально

## Качество

- E2E (Playwright) — главная + вход + публичные страницы (`e2e/home.spec.ts`, `login.spec.ts`, `public-pages.spec.ts`)
- A11Y: контраст WCAG AA; skip-link и якорь `#main-content` — v1.9.0; дальше — полный обход с клавиатуры по чеклисту
- Lighthouse ≥ 85

## Маркетинг / ниша (ongoing)

- См. **фаза 5** в `NICHE_DEVELOPERS_TRANSITION_PLAN.md` (контент, опционально `/developers`)
