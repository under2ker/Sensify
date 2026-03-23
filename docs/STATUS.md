# Статус реализации Sensify (актуально: **v1.9.3**)

Единая сводка **сделано / частично / не сделано**. Детали релизов — страница **`/changelog`** в приложении; дерево эволюции — [`PROJECT_HISTORY_TREE.md`](./PROJECT_HISTORY_TREE.md).

---

## Сделано (основное)

| Область | Что именно |
|---------|------------|
| **Источники** | GitHub, Reddit, URL (в т.ч. Substack как URL), Telegram, RSS, PDF, YouTube, Notion, текст |
| **Извлечение** | Groq, **Gemini**, Ollama; стриминг; пресеты dev; лимиты 10/день (автор.) и 3/день (гость); burst rate limit на `POST /api/extract` |
| **Сохранить страницу** | Readability + Markdown по URL |
| **Результат** | Табы: резюме, идеи, карточки, заметки, **код**, **ссылки**; редактирование блоков; AI-действия (углубиться, сравнить, вопросы) |
| **История** | Сайдбар, поиск, import/export JSON, persist; вкладки Недавние / Сохранённые / Корзина (локально) |
| **Пресеты** | 7 встроенных + **«Мои пресеты»** (до 14, **только localStorage**) |
| **Экспорт** | Буфер, «Красивый текст»; **премиум:** Obsidian, Notion JSON, Markdown, **PDF** (клиент pdf-lib), **Notion API** (child page) |
| **Премиум** | ЮKassa, webhook IP-check, подписка в БД; проверка на сервере для Notion; предпросмотр экспорта: фрагмент + блок копирования без премиума |
| **Платежи (админ)** | Таблица `PaymentLog`, запись из webhook `payment.succeeded`, **GET /api/admin/payments**, блок в админке |
| **Аккаунт** | Groq/Gemini ключи в БД, **ранняя подгрузка** после входа (`AccountApiKeysSync`) |
| **Webhook** | POST результата после извлечения; [`WEBHOOK_DEVELOPERS.md`](./WEBHOOK_DEVELOPERS.md) |
| **Шаринг** | Публичная ссылка `/s/[id]`; срок действия (`expiresAt` в БД, настройка в аккаунте, проверка в `GET /api/share/[id]`) |
| **Auth** | NextAuth, профиль, статистика |
| **Админка** | Пользователи, выдача/снятие премиума, поиск, пагинация, **журнал платежей** |
| **A11y** | Skip-link → `#main-content`, якорь на ключевых страницах |
| **Перфоманс** | `useShallow`, dynamic панелей на главной, LazyMarkdownPreview, memo в output, optimizePackageImports, prune rate-limit Map |
| **Безопасность** | SSRF для fetch URL; Ollama URL + whitelist; rate limit verify-groq/gemini; production CSP + HSTS в `next.config.ts`; см. [`SECURITY_PREMIUM.md`](./SECURITY_PREMIUM.md) |
| **E2E** | Playwright: главная (+ skip-link), вход, публичные `/changelog`, `/premium`, `/about` |
| **Unit** | Vitest: `npm run test` (share-expiry, validate Ollama URL); CI |
| **Ввод** | zod + красная обводка полей перед извлечением |
| **Доки** | `DATABASE_PRODUCTION.md`, `PERFORMANCE_NOTES.md`, `NOTION_EXPORT.md`, `SECURITY_PREMIUM.md` |

---

## Частично сделано

| Тема | Сделано | Осталось |
|------|---------|----------|
| **Rate limiting** | In-memory: verify-* , burst extract | Общий лимит для кластера (Redis/KV) |
| **Пресеты** | Локально в браузере | Синхронизация с аккаунтом / API |
| **Notion** | Страница-родитель, блоки | Экспорт в **database** с кастомными полями |
| **Премиум-экспорт** | UI + проверка API + клиентская генерация | «Жёсткая» защита только через **серверный** PDF/файлы (по желанию) |
| **A11y** | Skip-link, фокус, часть aria | WCAG AA контраст, полный keyboard-обход |
| **E2E** | Smoke сценарии | Сценарии извлечения, оплаты (mock) |
| **ТЗ / дизайн** | Большая часть UI | Отдельные пункты ниже в «не сделано» |

---

## Не сделано / в бэклоге

| Пункт | Примечание |
|-------|------------|
| **Уведомления** | Колокол в header |
| **Сайдбар** | Клиент: Recent / Saved / Trash; **Shared** и синк между устройствами — при необходимости backend |
| **Облачные пресеты** | См. частично |
| **Lighthouse ≥ 85** | Не замерялось в CI |
| **Контраст WCAG AA** | Требуется аудит токенов |
| **Production БД** | SQLite → Turso и др., см. `DATABASE_PRODUCTION.md` |
| **Ниша: фаза 5** | Контент-маркетинг, опционально `/developers` — см. `NICHE_DEVELOPERS_TRANSITION_PLAN.md` |
| **Optional niche** | Доп. упрощение вкладок источников — по необходимости |

---

## Связь с документами

| Документ | Назначение |
|----------|------------|
| [`TZ_SENSIFY_FUNCTIONALITY.md`](./TZ_SENSIFY_FUNCTIONALITY.md) | Функциональное ТЗ; в конце — обновлённые фазы |
| [`TZ_PRODUCTION_EDITION.md`](./TZ_PRODUCTION_EDITION.md) | **Production TZ** (DOCX → MD): аудит доков, риски, целевая архитектура v2.0, FR/NFR, roadmap |
| [`TZ_DESIGN.md`](./TZ_DESIGN.md) | Дизайн-требования; в начале — блок статуса |
| [`DESIGN_CHECKLIST.md`](./DESIGN_CHECKLIST.md) | Чеклист по экранам — отмечено [x]/[ ] |
| [`PLANNED_FEATURES.md`](./PLANNED_FEATURES.md) | Короткий указатель будущего |
| [`NICHE_DEVELOPERS_TRANSITION_PLAN.md`](./NICHE_DEVELOPERS_TRANSITION_PLAN.md) | План ниши dev и фазы 0–5 |
| [`PREMIUM_PLAN.md`](./PREMIUM_PLAN.md) | Исторический черновик; актуальная логика — код + `SECURITY_PREMIUM.md` |

---

*Обновляйте этот файл при крупных релизах или раз в спринт.*
