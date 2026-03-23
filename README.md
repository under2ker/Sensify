# Sensify

**v1.10.0** — AI для разработчиков: GitHub, Reddit, ссылки на доки, RSS, PDF, YouTube, Telegram, Notion и текст → структурированные заметки (Obsidian / Notion / Markdown, PDF, webhook). Облако (Groq, Gemini) или **Ollama** локально.

## Документация и статус

| Документ | Содержание |
|----------|------------|
| **[`docs/STATUS.md`](docs/STATUS.md)** | **Сделано / частично / не сделано** (главная сводка) |
| [`docs/TZ_SENSIFY_FUNCTIONALITY.md`](docs/TZ_SENSIFY_FUNCTIONALITY.md) | Функциональное ТЗ, фазы, чеклист разработки |
| [`docs/TZ_PRODUCTION_EDITION.md`](docs/TZ_PRODUCTION_EDITION.md) | Production-ТЗ (v1.10.0 → v2.0): архитектура, риски, roadmap |
| [`docs/TZ_DESIGN.md`](docs/TZ_DESIGN.md) | Дизайн-требования |
| [`docs/DESIGN_CHECKLIST.md`](docs/DESIGN_CHECKLIST.md) | Чеклист экранов по дизайну |
| [`docs/PLANNED_FEATURES.md`](docs/PLANNED_FEATURES.md) | Краткий бэклог |
| [`docs/NICHE_DEVELOPERS_TRANSITION_PLAN.md`](docs/NICHE_DEVELOPERS_TRANSITION_PLAN.md) | План ниши Developers |

## Возможности

- **Источники под dev** — GitHub, Reddit, URL, Telegram, RSS, PDF, YouTube, Notion, вставка текста (Substack — по обычной ссылке)
- **GitHub / Reddit** — для извлечения: README и файлы (API и raw), issue/PR, тред Reddit через JSON + топ комментарии; при сбое — загрузка страницы как раньше
- **Сохранить страницу** — извлечь читабельную статью по URL (Readability + Markdown)
- **AI-извлечение** — резюме, ключевые идеи, флеш-карточки, структурированные заметки
- **Стриминг** — текст появляется по мере генерации (можно отключить)
- **Пресеты** — встроенные + **«Мои пресеты»** (до 14 шт., в браузере и синхронизация с аккаунтом при входе)
- **AI-провайдеры** — Groq Cloud, **Google Gemini**, Ollama (локально)
- **Экспорт** — Obsidian, Notion (JSON + **отправка в Notion по API**), Markdown, PDF (премиум), буфер обмена, «Красивый текст»
- **Шаринг** — публичная ссылка на результат извлечения
- **Профиль** — личные данные, статистика извлечений, подписка, история
- **Премиум** — ЮKassa, безлимитные извлечения, экспорт в Obsidian/Notion/Markdown/PDF
- **Админка** — пользователи, выдача/снятие премиума, **журнал платежей** (ЮKassa)
- **API-ключи в аккаунте** — Groq и **Gemini** сохраняются в БД и подгружаются после входа
- **Webhook** — отправка результата на указанный URL после извлечения
- **Темы** — Classic / Warm, светлая / тёмная, авто по системным настройкам
- **Бренд** — знак: `public/brand/sensify-mark.svg` (карточки/футер), белый inline-вариант в шапке главной; **favicon** — `src/app/icon.svg` (Next.js подхватывает автоматически)
- **История идей → код** — схема в [`docs/PROJECT_HISTORY_TREE.md`](docs/PROJECT_HISTORY_TREE.md); детали по версиям — страница **«История изменений»** (`/changelog`)
- **Перфоманс** — конспект в [`docs/PERFORMANCE_NOTES.md`](docs/PERFORMANCE_NOTES.md) (лимиты API, бандл, zustand)
- **Премиум / безопасность** — что проверяется на сервере и ограничения клиентского экспорта: [`docs/SECURITY_PREMIUM.md`](docs/SECURITY_PREMIUM.md)

## Быстрый старт

### 1. Установите зависимости

```bash
npm install
```

### 2. Получите бесплатный API-ключ Groq

Перейдите на [console.groq.com/keys](https://console.groq.com/keys), создайте ключ — это бесплатно.

### 3. Запустите

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000), зайдите в Настройки и вставьте ключ Groq.

Или задайте ключ через переменную окружения (`.env.local`):

```bash
GROQ_API_KEY=gsk_your-key-here
```

## AI-провайдеры

### Groq Cloud (рекомендуется)

- **Бесплатно** — щедрые лимиты для личного использования
- **Молниеносно** — ответ за 2–5 секунд
- **Без установки** — работает сразу
- **Модели**: Llama 3.1 8B, Llama 3.3 70B, Gemma 2 9B, Mixtral 8x7B

### Ollama (опционально)

Для полностью локальной работы без отправки данных в облако:

```bash
# Установите Ollama с ollama.com, затем:
ollama pull llama3.1
ollama serve
```

Переключите провайдер на Ollama в настройках. Для внешнего сервера Ollama задайте `OLLAMA_URL_WHITELIST` в `.env`.

## Технологии

- **Фреймворк**: Next.js 15 (App Router), React 19
- **Язык**: TypeScript
- **Стили**: Tailwind CSS, Radix UI, glassmorphism
- **Состояние**: Zustand (localStorage)
- **Анимации**: Framer Motion
- **AI**: Groq Cloud / Google Gemini / Ollama
- **БД**: Prisma + SQLite
- **Авторизация**: NextAuth v5
- **PDF**: pdf-parse
- **YouTube**: youtube-transcript
- **Контент**: Readability + Turndown (save-page)

## Структура проекта

```
src/
├── app/
│   ├── api/
│   │   ├── extract/route.ts      # AI extraction (Groq/Gemini/Ollama, stream)
│   │   ├── parse-pdf/route.ts    # PDF parsing
│   │   ├── save-page/route.ts    # Readability → Markdown
│   │   ├── share/route.ts        # Создание шаринга
│   │   ├── share/[id]/route.ts   # Публичный доступ к результату
│   │   ├── auth/                 # NextAuth
│   │   ├── user/stats/           # Статистика
│   │   ├── user/premium/         # Проверка премиума
│   │   ├── user/groq-key/        # Ключ Groq в аккаунт
│   │   ├── user/gemini-key/      # Ключ Gemini в аккаунт
│   │   ├── payments/create/      # Создание платежа ЮKassa
│   │   ├── webhooks/yookassa/    # Webhook платежей
│   │   ├── verify-groq/          # Проверка ключа Groq
│   │   ├── verify-gemini/        # Проверка ключа Gemini
│   │   ├── verify-ollama/        # Проверка Ollama
│   │   ├── grant-premium/        # Выдача премиума (админ)
│   │   ├── revoke-premium/       # Снятие премиума (админ)
│   │   ├── admin/users/          # Список пользователей
│   │   └── admin/payments/       # Журнал платежей
│   ├── admin/page.tsx
│   ├── profile/page.tsx
│   ├── premium/page.tsx
│   ├── s/[id]/page.tsx           # Страница шаринга
│   ├── login/, register/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── input-panel.tsx
│   ├── output-panel.tsx
│   ├── export-panel.tsx
│   ├── history-sidebar.tsx
│   ├── settings-dialog.tsx
│   ├── admin-panel.tsx
│   ├── profile-stats.tsx
│   └── ...
├── lib/
│   ├── extract/                  # prompts, fetchers, parse-result
│   ├── ai-providers.ts           # Groq/Ollama вызовы
│   ├── validate.ts               # SSRF, URL, Ollama
│   ├── fetch-safe.ts
│   ├── store.ts
│   ├── exporters.ts
│   ├── auth.ts
│   └── ...
├── middleware.ts                 # Защита админских API
├── prisma/schema.prisma
└── types/
e2e/                              # Playwright E2E тесты
```

## Регистрация и авторизация

Для работы регистрации, входа, профиля и премиум-функций:

1. Создайте `.env` с `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` (см. `.env.example`)
2. Выполните `npx prisma db push`
3. Подробнее: [docs/AUTH_SETUP.md](docs/AUTH_SETUP.md) (если есть)

**Админка**: доступ по email в `ADMIN_EMAIL` (несколько через запятую). Выдача и снятие премиума.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Разработка |
| `npm run build` | Сборка |
| `npm run start` | Продакшен |
| `npm run lint` | ESLint |
| `npm run test` | Юнит-тесты (Vitest) |
| `npm run test:e2e` | E2E тесты (Playwright); при первом запуске: `npx playwright install` |
| `npm run lighthouse:ci` | Lighthouse CI (после `npm run build`; см. `lighthouserc.cjs`). Если Chrome не найден: `npx playwright install chromium` и переменная `LHCI_CHROME_PATH` = вывод `node -p "require('@playwright/test').chromium.executablePath()"` |
| `npm run db:push` | Применить схему Prisma |
| `npm run db:studio` | Prisma Studio |
| `npm run seed-users` | Создать тестовых пользователей |
| `npm run grant-premium` | Выдать премиум (см. скрипт) |

**Важно:** перед `npm run build` или `npx prisma generate` **остановите dev-сервер** (Ctrl+C). Иначе возможна ошибка EPERM из-за блокировки файлов Prisma.

## Docker

```bash
docker build -t sensify .
docker run -p 3000:3000 sensify
```

## Changelog

История изменений: `/changelog`

## Деплой

**Самый простой способ:** [vercel.com/new](https://vercel.com/new) → Import GitHub-репозиторий → Vercel сам соберёт проект при каждом push в `main` (отдельный workflow не обязателен).

**Переменные окружения на Vercel:** `GROQ_API_KEY`, `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, **`NEXT_PUBLIC_SITE_URL`** (канонический домен для OG, `sitemap.xml`, `robots.txt`), `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` (для платежей), при необходимости `GEMINI_API_KEY`, `SENTRY_DSN`, `TURSO_*` / `ENCRYPTION_KEY` — см. `.env.example`. **ЮKassa:** [docs/YOOKASSA_PAYMENTS.md](docs/YOOKASSA_PAYMENTS.md) (webhook, тест/бой, типичные ошибки).

**Деплой через GitHub Actions** (workflow `.github/workflows/deploy-vercel.yml`): в репозитории GitHub → **Settings → Secrets and variables → Actions** добавьте `VERCEL_TOKEN` (токен с [vercel.com/account/tokens](https://vercel.com/account/tokens)), `VERCEL_ORG_ID` и `VERCEL_PROJECT_ID` (из **Vercel → Project → Settings → General**). Затем **Actions → Deploy (Vercel) → Run workflow** или push в `main`.

SQLite не подходит для production на Vercel (несколько инстансов). Используйте Turso (в коде уже LibSQL-адаптер при `TURSO_*`) или см. альтернативы в [docs/DATABASE_PRODUCTION.md](docs/DATABASE_PRODUCTION.md); для распределённого rate limit — `UPSTASH_*` в [docs/PERFORMANCE_NOTES.md](docs/PERFORMANCE_NOTES.md). После выката полезно открыть **`GET /api/health`** (`databaseBackend`, `rateLimitDistributed`, `paymentsConfigured`).

---

## Реализовано (для ТЗ)

Детальное описание того, что уже сделано — для составления технического задания и спецификаций.

### Header (навигация)

| Элемент | Реализация |
|---------|------------|
| Высота | 64px (`h-16`) |
| Логотип (главная) | Крупный текст «Sensify» по центру шапки, клик → главная (без отдельной иконки) |
| Навигация по центру | Главная, О проекте, Changelog — скрыта на мобильных (`hidden md:flex`) |
| Hover на ссылки | 15% фона (`hover:bg-muted/15`), 200ms |
| Справа | Premium, Профиль/Вход, Theme toggle, Настройки |
| Кнопка меню | Открывает History Sidebar, `aria-label="Открыть историю"` |
| Кнопка Админ | Только для `ADMIN_EMAIL`, видна в header (desktop) и в настройках → Аккаунт |
| `isAdmin` в сессии | JWT содержит `isAdmin`, клиент не зависит от `ADMIN_EMAIL` |

### Input Panel (панель ввода)

| Элемент | Реализация |
|---------|------------|
| Источники | Табы: GitHub, Reddit, Ссылка, Telegram, RSS, PDF, YouTube, Notion, Текст |
| Ширина | ~360px на desktop (колонка ввода) |
| Placeholder URL | «Вставьте URL (Ctrl+V)...» |
| Пресеты | По умолчанию, Документация, Обсуждение / тред, Технические заметки, Задачи, Исследование / RFC, Релиз / changelog |
| Модель | Groq / Gemini / Ollama, список моделей в настройках и на панели ввода |
| CTA | Кнопка «Извлечь смысл» (компактная панель действий внизу карточки ввода) |
| Сохранить в историю | Чекбокс на панели ввода (`saveToHistory` в store) |
| Сохранить страницу | Кнопка для URL → Readability → Markdown |
| Показать работу | На каждом источнике: демо-URL/текст из `lib/demo-work-links.ts`; PDF — `public/samples/demo.pdf` |
| Карточка ввода | Компактная вёрстка; тень при наведении на обёртку (см. `input-panel.tsx`) |

### Output Panel (результат)

| Элемент | Реализация |
|---------|------------|
| Пустое состояние | EmptyStateIllustration, «Выберите источник и нажмите Извлечь» |
| Загрузка | ExtractionSkeleton, анимированная progress bar (0→70→90→70%) |
| Progress bar | Полоска + «Генерирую... (N символов)» |
| Кнопка Отмена | Прерывает fetch (AbortController), toast «Извлечение отменено» |
| Табы результата | Резюме, Идеи, Карточки, Заметки, Код, Ссылки |
| Markdown | ReactMarkdown с prose-стилями |
| Export | Copy, Share, Obsidian, Notion JSON, **Notion API** (кнопка), Markdown, **PDF** (премиум) |
| Карточки (флешкарты) | Hover: shadow + translateY |

### History Sidebar

| Элемент | Реализация |
|---------|------------|
| Ширина | 280px (`w-80`) |
| Поиск | Фильтр по названию и тегам |
| Export/Import | JSON, кнопки в sidebar |
| Мобильный режим | Выдвижная панель слева по кнопке Menu |
| Hover на элементы | `hover:shadow-lg`, `hover:-translate-y-0.5` |
| Удаление | Кнопка корзины при hover |

### Settings Dialog

| Элемент | Реализация |
|---------|------------|
| Вкладки | AI Provider, Theme, Account |
| AI | Groq / Gemini / Ollama, ключи, Verify, модели, пресет, качество, язык, стриминг |
| Theme | Classic / Warm, Light / Dark / Auto |
| Account | Webhook URL, **Notion** (secret + родительская страница для API), email, ссылки: Профиль, Премиум, Админ |
| Groq ключ в аккаунте | Сохранение в БД, загрузка в настройки |

### Profile Page

| Элемент | Реализация |
|---------|------------|
| Данные | Email, дата регистрации, подписка (Premium/Free) |
| ProfileStats | 4 карточки: Запросы, Файлы, История, Премиум (2×2 grid) |
| Последние извлечения | Таблица с поиском (до 15 записей) |
| Grant Premium | Кнопка для админов |
| Ссылка на Админ | Для админов |

### Admin Panel

| Элемент | Реализация |
|---------|------------|
| Доступ | `ADMIN_EMAIL`, redirect при отсутствии прав |
| Quick stats | 4 карточки: Пользователей, Премиум, Извлечений, Активных |
| Выдать премиум | Форма email + кнопка |
| Таблица пользователей | Email, Имя, Регистрация, Запросы, Файлы, Премиум, Выдать/Снять |
| Поиск | По email и имени, клиентская фильтрация |
| Пагинация | 15 на страницу, Prev/Next, «стр. X из Y» |
| Журнал платежей | Таблица оплат ЮKassa (до 80 записей), `GET /api/admin/payments` |

### Дизайн и UX

| Элемент | Реализация |
|---------|------------|
| Темы | Classic Light/Dark, Warm Light/Dark, Auto |
| CSS variables | `--primary`, `--background`, `--foreground`, и др. |
| Glassmorphism | `backdrop-blur`, header и карточки |
| Card hover | На input, output, admin, profile, history |
| Framer Motion | Анимации появления панелей, sidebar |
| Адаптив | Mobile (стек), tablet (flex), desktop (3 колонки) |
| Mobile Export | Кнопка внизу справа → bottom sheet |

### Доступность (A11Y)

| Элемент | Реализация |
|---------|------------|
| `:focus-visible` | В globals.css для кнопок и ссылок |
| `role="banner"` | Header |
| `aria-label` | Кнопки меню, экспорта, закрытия |
| Skip link → `#main-content` | Первый фокус в layout: «Перейти к содержимому»; у `<main>` / корня — `id`, `tabIndex={-1}` |
| Form labels | `htmlFor` + `id` для: admin grant, admin search, settings webhook, profile search |

### API и бэкенд

| Endpoint | Назначение |
|----------|------------|
| `POST /api/extract` | Извлечение (stream/non-stream), Groq/Gemini/Ollama |
| `POST /api/parse-pdf` | Парсинг PDF |
| `POST /api/save-page` | Readability → Markdown по URL |
| `POST /api/share` | Создание публичной ссылки |
| `GET /api/share/[id]` | Публичный результат |
| `GET /api/user/stats` | Статистика пользователя |
| `GET /api/admin/users` | Список пользователей (админ) |
| `GET /api/admin/payments` | Журнал оплат ЮKassa (админ, до 80 записей) |
| `POST /api/grant-premium` | Выдача премиума (админ) |
| `POST /api/revoke-premium` | Снятие премиума (админ) |
| Webhook ЮKassa | Обработка платежей, запись в `PaymentLog` |

### Не реализовано (для будущего ТЗ)

- Notifications bell в header
- Пресеты в облаке (сейчас **«Мои пресеты»** только в браузере, до 14 шт.)
- Табы Sidebar: [Recent] [Saved] [Shared] [Trash] — нужен backend
- Input field error (красный border при валидации)
- Цветовой контраст ≥4.5:1 — проверить
- Lighthouse ≥85
