# Статус реализации Sensify (актуально: **v1.10.0**)

Единая сводка **сделано / частично / не сделано**. Детали релизов — страница **`/changelog`** в приложении; дерево эволюции — [`PROJECT_HISTORY_TREE.md`](./PROJECT_HISTORY_TREE.md).

---

## Сделано (основное)

| Область | Что именно |
|---------|------------|
| **Источники** | GitHub, Reddit, URL (в т.ч. Substack как URL), Telegram, RSS, PDF, YouTube, Notion, текст |
| **Извлечение** | Groq, **Gemini**, Ollama; стриминг; пресеты dev; лимиты 10/день (автор.) и 3/день (гость); burst rate limit на `POST /api/extract` |
| **Сохранить страницу** | Readability + Markdown по URL |
| **Результат** | Табы: резюме, идеи, карточки, заметки, **код**, **ссылки**; редактирование блоков; AI-действия (углубиться, сравнить, вопросы); **перевод EN→RU** всего материала; UI «Разделы» / «Действия»; **Поделиться** (Web Share или диалог со ссылкой) отдельно от **копирования текста вкладки** |
| **История** | Сайдбар, поиск, import/export JSON, persist; вкладки Недавние / Сохранённые / Корзина (локально) |
| **Пресеты** | 7 встроенных + **«Мои пресеты»** (до 14, localStorage + **синхронизация с аккаунтом** `user_presets`) |
| **Экспорт** | Буфер, «Красивый текст»; **премиум:** Obsidian, Notion JSON, Markdown, **PDF** (клиент pdf-lib), **Notion API** (child page) |
| **Премиум** | ЮKassa, webhook IP-check, подписка в БД; проверка на сервере для Notion; предпросмотр экспорта: фрагмент + блок копирования без премиума |
| **Платежи (админ)** | Таблица `PaymentLog`, запись из webhook `payment.succeeded`, **GET /api/admin/payments**, блок в админке |
| **Аккаунт** | Groq/Gemini ключи в БД, **ранняя подгрузка** после входа (`AccountApiKeysSync`) |
| **Webhook** | POST результата после извлечения; [`WEBHOOK_DEVELOPERS.md`](./WEBHOOK_DEVELOPERS.md) |
| **Шаринг** | Публичная ссылка `/s/[id]`; срок действия (`expiresAt` в БД, настройка в аккаунте, проверка в `GET /api/share/[id]`); **`Share.userId`**, **`GET /api/user/shares`**, вкладка **«Ссылки»** в сайдбаре истории |
| **Auth** | NextAuth, профиль, статистика |
| **Админка** | Пользователи, выдача/снятие премиума, поиск, пагинация, **журнал платежей** |
| **A11y** | Skip-link → `#main-content`, якорь на ключевых страницах; `aria-live` / `role="status"` при загрузке и ошибке извлечения; **подправлен `muted-foreground`**; **`htmlFor` / `id` на полях `/login` и `/register`** |
| **/developers** | Лендинг для интеграций: webhook, экспорт, Ollama, health; ссылки из шапки главной, футера и **`/about`** (фаза 5 плана ниши) |
| **SEO** | **`sitemap.xml`**, **`robots.txt`**, `getCanonicalSiteUrl()` / `NEXT_PUBLIC_SITE_URL` |
| **Уведомления (UI)** | Колокол в шапке **главной** (`HeaderNotificationsBell`), пустое состояние в dropdown |
| **Перфоманс** | `useShallow`, dynamic панелей на главной, LazyMarkdownPreview, memo в output, optimizePackageImports, prune rate-limit Map |
| **Стор** | Zustand: слайсы UI / история / настройки (`src/stores/slices/`), единый `persist` в `src/lib/store.ts` |
| **БД** | Репозитории Prisma: `src/lib/db/repositories/` (share, user, **user-presets**, billing) для части API |
| **Health** | `GET /api/health` — БД, `databaseBackend` (turso/sqlite), `rateLimitDistributed` (Upstash), `paymentsConfigured` (ЮKassa) |
| **Безопасность** | SSRF для fetch URL; Ollama URL + whitelist; rate limit verify-groq/gemini; production CSP + HSTS в `next.config.ts`; см. [`SECURITY_PREMIUM.md`](./SECURITY_PREMIUM.md) |
| **E2E** | Playwright: главная (+ skip-link), вход, публичные страницы, health, **seo** (`sitemap`/`robots`), мок extract, **клавиатура `/login`**; job **`e2e`** в GitHub Actions |
| **Lighthouse CI** | `lighthouserc.cjs`, `npm run lighthouse:ci`, job **`lighthouse`** в CI (a11y / best-practices ≥ 85%) |
| **Unit** | Vitest: `npm run test` (share-expiry, validate Ollama, **user-presets-merge**, **translate-extraction-json**); CI |
| **Ввод** | zod + красная обводка полей перед извлечением |
| **Доки** | `DATABASE_PRODUCTION.md`, `PERFORMANCE_NOTES.md`, `NOTION_EXPORT.md`, `SECURITY_PREMIUM.md`, **`YOOKASSA_PAYMENTS.md`** |

---

## Частично сделано

| Тема | Сделано | Осталось |
|------|---------|----------|
| **Rate limiting** | In-memory fallback; **Upstash** при `UPSTASH_*` — extract burst, verify-* | Альтернативы (Vercel KV и т.д.) не подключены |
| **Пресеты** | Локально + **облако** (`/api/user/presets`, слияние при входе) | Версионирование / выбор источника при конфликте |
| **Notion** | Страница-родитель, блоки | Экспорт в **database** с кастомными полями |
| **Премиум-экспорт** | UI + проверка API + клиентская генерация | «Жёсткая» защита только через **серверный** PDF/файлы (по желанию) |
| **A11y** | Skip-link, фокус, часть aria | WCAG AA контраст, полный keyboard-обход |
| **E2E** | Smoke + мок извлечения (NDJSON) | Оплата (mock), полный happy-path с реальным AI |
| **ТЗ / дизайн** | Большая часть UI | Отдельные пункты ниже в «не сделано» |

---

## Не сделано / в бэклоге

| Пункт | Примечание |
|-------|------------|
| **Уведомления (данные)** | Список событий с сервера / push в колокол — не реализовано |
| **Сайдбар (синк)** | Синхронизация **локальной** истории между устройствами — при необходимости backend |
| **Lighthouse ≥ 85** | Не замерялось в CI |
| **Контраст WCAG AA** | Требуется аудит токенов |
| **Production БД** | Runtime **Turso** по env + адаптер; чеклист деплоя — `DATABASE_PRODUCTION.md` |
| **Ниша: фаза 5** | Контент-маркетинг (соцсети / PH); `/developers` — см. сделано |
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
