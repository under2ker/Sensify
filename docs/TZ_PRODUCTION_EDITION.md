# Sensify — ТЗ Production Edition (v1.10.0 → v2.0 target)

> **Источник:** `Sensify_TZ_Production.docx` (март 2026). Текст перенесён из исходного DOCX; структура таблиц Word здесь представлена списками и абзацами, не как в оригинале.
>
> **Актуальность кода:** сверяйте с **[`STATUS.md`](./STATUS.md)** и репозиторием — отдельные формулировки ниже (например, про E2E или абстракцию AI) могут отставать от фактической реализации.

---

SENSIFY

Техническое Задание — Production Edition

AI-ассистент для разработчиков: извлечение и структурирование знаний

Параметр

Значение

Документ

Техническое задание (ТЗ)

Версия продукта

v1.10.0 → v2.0 (target)

Классификация

Конфиденциально / Внутреннее

Статус

Финальный черновик

Дата

Март 2026

Роль составителя

Senior System Analyst / Technical Architect / PM

ЧАСТЬ 1 — АНАЛИЗ ПРОЕКТА

1.1 Назначение системы и текущее состояние

Sensify — это веб-приложение (Next.js 15 / React 19), позиционируемое как AI-ассистент для разработчиков. Система принимает контент из 9 типов источников (URL, PDF, YouTube, GitHub, Reddit, Telegram, RSS, Notion, текст), прогоняет его через AI-провайдер (Groq / Gemini / Ollama) и возвращает структурированные заметки в форматах Obsidian, Notion, Markdown, PDF.

Текущая версия: v1.10.0. Продукт прошёл путь от MVP (v1.0) до монетизированного SaaS с премиум-подпиской (ЮKassa), административной панелью и полноценной системой аутентификации (NextAuth v5).

1.2 Анализ файлов проекта

README.md

Роль: главный входной документ. Хорошо структурирован, содержит quick start, описание возможностей, структуру проекта, команды. Слабые места: отсутствует раздел «Архитектурное решение» и обоснование технических выборов; нет описания схемы Prisma; деплой-секция только упоминает проблему SQLite без чёткого решения.

STATUS.md

Роль: центральный трекер состояния реализации. Качество: высокое — чёткое разделение «сделано / частично / бэклог». Проблема: этот файл является единственным источником истины о состоянии разработки, что нормально для одного разработчика, но не масштабируется при команде. Требуется миграция в систему task-трекинга (GitHub Issues / Linear).

TZ_SENSIFY_FUNCTIONALITY.md (56 KB)

Роль: основное функциональное ТЗ. Достоинства: детально описаны все источники с пайплайном обработки, пресеты, экспорт, шаринг, профиль, премиум, администрирование. Проблемы: документ содержит как требования, так и статус реализации — смешение ответственностей. Часть разделов помечена ⚠️ ТРЕБУЕТСЯ РЕАЛИЗАЦИЯ, но документ остаётся одним монолитным файлом без версионирования требований.

TZ_DESIGN.md (39 KB)

Роль: дизайн-требования. Детально описаны размеры, цветовые переменные, компоненты. Слабое место: нет токенизированной дизайн-системы (Design Tokens), нет Figma-ссылок, нет описания responsive breakpoints в формате кода.

DESIGN_CHECKLIST.md

Роль: чеклист дизайна по экранам. Качество хорошее. Критические незакрытые пункты: WCAG AA контраст, Lighthouse ≥85, keyboard navigation, валидация полей (красная обводка), виртуализация длинных списков.

NICHE_DEVELOPERS_TRANSITION_PLAN.md (15 KB)

Роль: стратегический план репозиционирования в dev-нишу. Фазы 0–4 в основном выполнены. Слабые места: решения о Notion/YouTube как источниках так и не приняты (документ фиксирует нерешённость). Рекомендации §2 по скрытию источников не внедрены.

DATABASE_PRODUCTION.md

Роль: инструкция миграции с SQLite на облачную БД. Содержательный и корректный. Критическая проблема: SQLite остаётся в production — это блокер для любого деплоя на Vercel с несколькими инстансами. Документ описывает решение, но оно не реализовано.

PERFORMANCE_NOTES.md

Роль: конспект оптимизаций. Качество высокое — зафиксированы реальные меры (useShallow, dynamic imports, memo, optimizePackageImports). Узкое место: in-memory rate limiting не работает при нескольких инстансах — критично для production.

SECURITY_PREMIUM.md

Роль: граница защиты премиум-функций. Честная документация: явно указаны слабые места (клиентский экспорт обходим). Рекомендация перенести PDF-генерацию на сервер — не реализована.

PREMIUM_PLAN.md

Роль: исторический черновик (помечен как устаревший). Архивный документ, актуальность — нулевая. Следует удалить или переименовать в PREMIUM_PLAN_ARCHIVE.md.

PLANNED_FEATURES.md

Роль: краткий бэклог. Служит указателем на другие документы. Нет приоритетов, нет оценок трудоёмкости — бэклог без весов бесполезен для планирования спринта.

NOTION_EXPORT.md / WEBHOOK_DEVELOPERS.md

Роль: документация интеграций для конечных пользователей. Качество: хорошее. Слабое место: токен Notion хранится в localStorage — риск XSS-атак, следует хранить только в encrypted-cookie или в БД с шифрованием.

PROJECT_HISTORY_TREE.md

Роль: архитектурная история эволюции продукта. Ценный документ для onboarding новых разработчиков. Слабость: не связан с git-тегами релизов — нет возможности перейти от описания версии к конкретному коммиту.

1.3 Текущая архитектура

Стек: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + Zustand + Prisma + SQLite + NextAuth v5 + Framer Motion + Radix UI.

Слой

Технология

Проблемы

Фронтенд

Next.js App Router, React 19, Zustand

Нет разделения state на server/client state; Zustand persist хранит чувствительные данные (API-ключи) в localStorage

API (BFF)

Next.js Route Handlers

Нет централизованного middleware для логирования и трейсинга; rate limiting in-memory — не работает при cluster

База данных

Prisma + SQLite

SQLite — блокер production при multi-instance деплое

Аутентификация

NextAuth v5

Корректная реализация; JWT содержит isAdmin — потенциальный вектор если секрет скомпрометирован

AI-провайдеры

Groq / Gemini / Ollama

Нет абстракции провайдера (Provider Pattern) — добавление нового провайдера требует изменений в нескольких местах

Экспорт

Клиентская генерация (pdf-lib)

PDF и Markdown генерируются на клиенте — премиум-защита обходима

Rate Limiting

In-memory Map

Не работает при нескольких инстансах — нужен Redis/KV

Хранение секретов

localStorage (Zustand persist)

API-ключи в localStorage уязвимы к XSS

1.4 Критические узкие места

Следующие проблемы являются блокерами production-деплоя или существенными рисками безопасности:

SQLite в production: невозможен горизонтальный масштаб, гонки при concurrent writes, отсутствие репликации

API-ключи в localStorage: при XSS-атаке компрометируются ключи Groq/Gemini пользователя

In-memory rate limiting: при деплое на Vercel (serverless) каждый инстанс имеет свой счётчик — обход тривиален

Клиентский экспорт премиум-форматов: технически подкованный пользователь может вызвать экспортёры из консоли

Отсутствие централизованного логирования: нет структурированных логов, нет трейсинга запросов

Нет E2E-тестов для критических пользовательских путей: извлечение, оплата, экспорт

ЧАСТЬ 2 — РЕИНЖИНИРИНГ АРХИТЕКТУРЫ

2.1 Целевая архитектура

Предлагается переход к чёткой слоистой архитектуре с разделением ответственностей. Ключевые принципы: separation of concerns, fail-fast validation, server-side premium enforcement, provider abstraction.

Слои системы

Слой

Ответственность

Технология (target)

Presentation

UI-компоненты, анимации, адаптивность

React 19, Tailwind, Radix UI, Framer Motion

State Management

Клиентское состояние (только UI-state)

Zustand (без чувствительных данных)

API Gateway (BFF)

Маршрутизация, аутентификация, rate limiting, логирование

Next.js Route Handlers + Middleware

Business Logic

Пресеты, промпты, экстракция, экспорт

Сервисный слой (src/services/)

AI Abstraction

Унифицированный интерфейс провайдеров

Provider Pattern (src/lib/ai/)

Data Access

CRUD операции, миграции

Prisma + PostgreSQL (Turso/Neon)

Infrastructure

Rate limiting, кэш, очереди

Upstash Redis / Vercel KV

Observability

Логи, метрики, трейсинг

Pino / OpenTelemetry / Sentry

2.2 Рефакторинг структуры проекта

Текущая структура src/lib/ является монолитным catch-all. Предлагается разбить на явные домены:

Текущий путь

Целевой путь

Обоснование

src/lib/extract/

src/services/extraction/

Бизнес-логика отделяется от утилит

src/lib/ai-providers.ts

src/lib/ai/providers/{groq,gemini,ollama}.ts

Provider Pattern — каждый провайдер изолирован

src/lib/exporters.ts

src/services/export/

Серверный экспорт для премиум-форматов

src/lib/store.ts

src/stores/{ui,history,settings}.ts

Разбивка стора по доменам

src/lib/validate.ts

src/lib/security/validate.ts

Явная принадлежность к security-слою

src/components/

src/components/{ui,features,layouts}/

Атомарная структура компонентов

2.3 Ключевые архитектурные решения

AI Provider Abstraction

Текущая проблема: добавление нового AI-провайдера требует изменений в route handler, компонентах настроек и нескольких утилитах. Решение — интерфейс AIProvider:

interface AIProvider { complete(prompt, options): Promise<Stream>; verify(key): Promise<boolean>; models(): Model[]; }

Server-Side Premium Export

Текущая проблема: PDF/Markdown/Obsidian генерируются на клиенте — премиум-защита символическая. Решение: POST /api/export/{format} с проверкой сессии и premiumUntil на сервере. Клиент получает только готовый файл.

Secret Storage Security

Текущая проблема: API-ключи в localStorage. Решение: хранить только в HttpOnly-cookie (session) или в БД в encrypted-колонке (AES-256-GCM, ключ из env). Zustand persist — только для UI-состояния (тема, язык, пресеты без секретов).

Distributed Rate Limiting

Текущая проблема: in-memory Map не работает при serverless/multi-instance. Решение: Upstash Redis (Redis-compatible serverless KV) с скользящим окном. Библиотека @upstash/ratelimit даёт готовый sliding window и token bucket.

ЧАСТЬ 3 — ПОЛНОЕ ТЕХНИЧЕСКОЕ ЗАДАНИЕ

3.1 Общая цель проекта

Sensify — это SaaS-платформа для структурирования знаний, ориентированная на разработчиков. Система принимает неструктурированный контент из множества источников (GitHub, Reddit, URL, PDF, YouTube, Telegram, RSS, Notion, текст), обрабатывает его через AI-провайдер и возвращает структурированные заметки, пригодные для экспорта в Obsidian, Notion, Markdown, PDF или отправки в пользовательский webhook.

Ключевая проблема, которую решает система: разработчик тратит часы на обработку информационного потока — тредов GitHub Issues, обсуждений Reddit, технических статей, релиз-нот, документации API. Sensify сокращает это время до секунд, сохраняя результат в удобном для second brain формате.

3.2 Функциональные требования

FR-01: Источники контента

Система должна поддерживать следующие типы источников (InputType):

ID

Источник

Метод получения контента

Статус

SRC-01

URL (веб-страница)

Fetch + Readability + Turndown → Markdown

✓ Реализовано

SRC-02

PDF

Загрузка файла → /api/parse-pdf → pdf-parse → текст

✓ Реализовано

SRC-03

YouTube

youtube-transcript → транскрипт + метаданные

✓ Реализовано

SRC-04

GitHub

GitHub Contents API + raw blob; Issues/PR через API; fallback HTML

✓ Реализовано

SRC-05

Reddit

Reddit JSON API (.json суффикс) + топ-комментарии; fallback HTML

✓ Реализовано

SRC-06

Telegram

Fetch публичного канала t.me/ + Readability парсинг

✓ Реализовано

SRC-07

RSS

Fetch XML + xml2js парсинг + последние N статей

✓ Реализовано

SRC-08

Notion

Notion API или публичный URL + парсинг блоков

✓ Реализовано

SRC-09

Текст

Прямой ввод в textarea (max 100 000 символов)

✓ Реализовано

SRC-10

Substack

Убрать как отдельный тип; обрабатывается через SRC-01 (URL)

Миграция

Общие требования к парсингу:

Таймаут запроса: 15 секунд; retry 2x с exponential backoff (1s, 3s)

Лимит контента для AI: 100 000 символов (жёсткая обрезка с уведомлением)

SSRF-защита: проверка URL до fetch (whitelist/blacklist IP-диапазонов, loopback, RFC1918)

User-Agent rotation для снижения риска блокировок

При пустом результате парсинга: ошибка с конкретным сообщением, не падение

FR-02: AI-извлечение

Пайплайн AI-обработки:

Валидация и санитизация входного контента

Выбор промпта на основе активного пресета

Подстановка переменных {КОНТЕНТ}, {ЯЗЫК}, {КАЧЕСТВО}

Отправка в выбранный AI-провайдер

Парсинг JSON-ответа в структуру ExtractionResult

Сохранение в историю (если чекбокс активен)

Отправка webhook (если URL задан в настройках)

Структура ExtractionResult:

Поле

Тип

Описание

title

string

Автогенерированный заголовок

summary

string (Markdown)

Резюме — вкладка «Резюме»

keyIdeas

string[] | string

Ключевые идеи — вкладка «Идеи»

flashcards

{ front, back }[]

Флеш-карточки — вкладка «Карточки»

structuredNotes

string (Markdown)

Структурированные заметки — вкладка «Заметки»

codeSnippets

{ title, language, code, explanation }[]

Блоки кода — вкладка «Код»

extractedLinks

{ href, label, description? }[]

Извлечённые ссылки — вкладка «Ссылки»

tags

string[]

Автогенерированные теги

sourceType

InputType enum

Тип источника

source

string

URL / имя файла / заголовок

model

string

Использованная модель

preset

ExtractionPreset enum

Использованный пресет

createdAt

ISO 8601

Timestamp создания

FR-03: AI-провайдеры

Провайдер

Тип

Модели

Требования

Groq Cloud

Облачный

llama-3.1-8b, llama-3.3-70b, gemma-2-9b, mixtral-8x7b

GROQ_API_KEY (env или user БД)

Google Gemini

Облачный

gemini-2.0-flash, gemini-1.5-pro

GEMINI_API_KEY (env или user БД)

Ollama

Локальный

Любая установленная модель

OLLAMA_URL + OLLAMA_URL_WHITELIST

Все провайдеры реализуют единый интерфейс AIProvider (complete, verify, models)

Поддержка streaming (ReadableStream) и non-streaming режимов

Retry logic: 2 попытки с backoff; специфичные сообщения ошибок по HTTP-статусу

API-ключи пользователя хранятся в БД (зашифровано), подгружаются после входа

FR-04: Пресеты извлечения

ID пресета

Название

Фокус

Статус

default

По умолчанию

Общее резюме, ключевые факты, выводы

✓

technical_docs

Документация

API, команды, параметры, примеры

✓

discussion

Обсуждение / тред

Позиции, контраргументы, консенсус

✓

technical_notes

Технические заметки

Конспект по документации

✓

action_items

Задачи

Action items из issues / тредов

✓

research

Исследование / RFC

Гипотеза, методология, результаты

✓

release_notes

Релиз / Changelog

Breaking changes, миграция, новое

✓

custom

Мои пресеты

Пользовательский промпт (до 14, localStorage)

✓ локально

Требования к промптам:

Каждый пресет имеет системный промпт и пользовательский шаблон с плейсхолдерами {КОНТЕНТ} и {ЯЗЫК}

Промпты версионируются в src/lib/extract/prompts.ts

Промпты должны запрашивать ответ в JSON-формате с полями ExtractionResult

Пользовательские пресеты: до 14 штук, хранение в localStorage (Zustand persist); синхронизация с БД — v2.1

FR-05: Параметры генерации

Параметр

Опции

Влияние

Язык вывода

Русский, English, Español, Français, Deutsch, Italiano, 中文

Подставляется в промпт как {ЯЗЫК}

Качество (Quality)

Краткий (fast) / Баланс (balanced) / Глубокий (deep)

Меняет temperature и max_tokens в запросе к AI

Стриминг

Включён / Выключён

Переключает режим ответа (stream / batch)

FR-06: Экспорт результатов

Формат

Доступность

Реализация

Статус

Буфер обмена

Бесплатно

Клиент, navigator.clipboard

✓

Красивый текст

Бесплатно

Форматированный HTML → буфер / .txt

✓ частично

Obsidian (.md)

Премиум

YAML frontmatter + Markdown → .md файл

✓ (клиент)

Notion JSON

Премиум

Notion block format → .json файл

✓ (клиент)

Notion API

Премиум

POST /api/integrations/notion/push → дочерняя страница

✓ (сервер)

Markdown (.md)

Премиум

Raw markdown → .md файл

✓ (клиент)

PDF

Премиум

pdf-lib → .pdf (клиент) → цель: /api/export/pdf (сервер)

✓ (клиент)

Webhook

Бесплатно

POST на user webhook URL после извлечения

✓

Требование безопасности экспорта (v2.0):

Все премиум-форматы (Obsidian, Notion, Markdown, PDF) должны генерироваться на сервере через /api/export/{format}

Клиент отправляет resultId (не сырые данные), сервер проверяет premiumUntil и возвращает файл

Preview без премиума: первые 200 символов, заблокированы copy/select/context menu

FR-07: История и управление результатами

Функция

Описание

Статус

История (Recent)

Список всех извлечений, поиск по названию и тегам

✓

Поиск по истории

Клиентская фильтрация по title, tags, sourceType

✓

Import/Export JSON

Экспорт всей истории в JSON, импорт обратно

✓

Пин (Saved)

Пометить результат isPinned: true → вкладка Saved

✗ Бэклог

Шаринг (Shared)

Результаты с публичной ссылкой → вкладка Shared

✗ Бэклог

Корзина (Trash)

Мягкое удаление с deletedAt, восстановление

✗ Бэклог

Публичная ссылка

POST /api/share → URL /s/[id], без авторизации

✓

Срок ссылки

expiresAt в БД, проверка при GET /s/[id]

✗ Бэклог

FR-08: Аутентификация и профиль

Регистрация по email + пароль (NextAuth v5, Credentials provider)

Вход, выход, сессия в JWT (содержит userId, email, isAdmin, isPremium)

Профиль: email, дата регистрации, статус подписки, статистика (запросы / файлы / история / premium)

Последние 15 извлечений в таблице с поиском и пагинацией

API-ключи Groq / Gemini: хранение в БД (шифрованное), подгрузка после входа

FR-09: Премиум-подписка

Провайдер оплаты: ЮKassa (webhook payment.succeeded → запись в PaymentLog + обновление premiumUntil)

Тарифы: месячный / годовой (суммы в конфигурации)

Лимиты: гость — 3/день, авторизованный — 10/день, премиум — без ограничений

Все премиум-ограничения проверяются на сервере (не доверяем клиенту)

Burst rate limit на POST /api/extract: защита от всплесков (target: через Redis)

FR-10: Администрирование

Доступ: ADMIN_EMAIL env (несколько через запятую); флаг isAdmin в JWT

Быстрая статистика: Users, Premium, Extractions, Active (за 30 дней)

Управление пользователями: список, поиск, пагинация (15 на стр.), выдача/снятие премиума

Журнал платежей: таблица PaymentLog, до 80 последних записей

3.3 Нефункциональные требования

NFR-01: Производительность

Метрика

Целевое значение

Текущее состояние

Time to first byte (TTFB)

≤ 300 ms

Не замерено

Время AI-ответа (Groq, streaming start)

≤ 5 сек

2–5 сек ✓

Lighthouse Performance

≥ 85

Не замерено ✗

Lighthouse Accessibility

≥ 90

Не замерено ✗

Bundle size (first load JS)

≤ 200 KB gzip

Оптимизировано частично

API endpoint latency p95

≤ 500 ms (кроме AI)

Не замерено

NFR-02: Масштабируемость

База данных: PostgreSQL-совместимое облачное решение (Turso / Neon / Supabase) — обязательно до production

Rate limiting: Upstash Redis с sliding window — обязательно при multi-instance деплое

Stateless API: все Route Handlers не хранят состояние в памяти (кроме in-memory rate limit — к замене)

Horizontal scaling: совместимость с Vercel serverless (cold starts ≤ 2 сек)

NFR-03: Безопасность

Требование

Реализация

Статус

SSRF-защита

assertUrlSafeForFetch() до любого внешнего fetch

✓

Rate limiting (verify endpoints)

In-memory, лимиты на verify-groq/gemini/ollama

✓ (in-memory)

Шифрование API-ключей в БД

AES-256-GCM, ключ из ENCRYPTION_KEY env

✗ Требуется

HttpOnly cookies для сессии

NextAuth httpOnly: true (по умолчанию)

✓

CSP headers

Content-Security-Policy в next.config.js

✗ Требуется

Webhook ЮKassa IP-whitelist

Проверка IP при входящем webhook

✓

Admin route protection

Middleware + isAdmin JWT claim

✓

XSS-защита в markdown

sanitize-html или DOMPurify перед рендером

✓ частично

Dependency audit

npm audit в CI

✗ Требуется

NFR-04: Доступность (A11Y)

WCAG 2.1 Level AA — цель для всех экранов

Цветовой контраст ≥ 4.5:1 для текста, ≥ 3:1 для UI-элементов

Полная keyboard navigation: Tab, Shift+Tab, Enter, Escape, Arrow keys

ARIA-атрибуты: role, aria-label, aria-live для динамического контента (streaming output)

Skip link к #main-content — реализован ✓

Семантические HTML-теги: main, nav, header, aside, section

NFR-05: Тестирование

Уровень

Инструмент

Покрытие (цель)

Статус

Unit

Vitest / Jest

Парсеры, промпты, валидаторы, exporters — 80%+

✗ Отсутствует

Integration

Vitest + MSW

API routes, AI provider calls — ключевые сценарии

✗ Отсутствует

E2E

Playwright

Критические user journeys (см. ниже)

Частично ✓

Visual regression

Playwright screenshots

Ключевые экраны

✗ Отсутствует

Accessibility

axe-core / Playwright

Все страницы

✗ Отсутствует

Performance

Lighthouse CI

В pipeline при PR

✗ Отсутствует

Обязательные E2E-сценарии:

Регистрация → вход → первое извлечение (URL) → экспорт в буфер

Извлечение GitHub URL → проверка вкладок резюме/идеи/код/ссылки

Извлечение PDF файла → результат отображается

Стриминг: прогресс-бар отображается, отмена работает

Публичная ссылка: создание → переход по ссылке без авторизации

Оплата (mock): webhook → обновление статуса → доступ к премиум-экспорту

Администрирование: вход под admin → выдача премиума → проверка статуса

3.4 Идеальная структура проекта

Целевая структура после рефакторинга (v2.0):

sensify/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Route group: login, register
│   │   ├── (dashboard)/            # Route group: main app
│   │   ├── admin/                  # Защищённая admin area
│   │   ├── profile/
│   │   ├── premium/
│   │   ├── s/[id]/                 # Публичный шаринг
│   │   ├── changelog/
│   │   └── api/                    # Route Handlers
│   │       ├── extract/            # POST: AI extraction
│   │       ├── export/             # POST: server-side export
│   │       │   ├── pdf/
│   │       │   ├── obsidian/
│   │       │   └── markdown/
│   │       ├── share/
│   │       ├── integrations/
│   │       │   └── notion/
│   │       ├── user/
│   │       ├── admin/
│   │       ├── auth/
│   │       ├── payments/
│   │       └── webhooks/
│   ├── components/
│   │   ├── ui/                     # Shadcn/Radix примитивы
│   │   ├── features/               # Доменные компоненты
│   │   │   ├── extraction/         # InputPanel, OutputPanel
│   │   │   ├── history/            # HistorySidebar
│   │   │   ├── export/             # ExportPanel
│   │   │   ├── settings/           # SettingsDialog
│   │   │   ├── profile/            # ProfileStats
│   │   │   └── admin/              # AdminPanel
│   │   └── layouts/                # Header, Footer, PageLayout
│   ├── services/                   # Бизнес-логика
│   │   ├── extraction/
│   │   │   ├── fetchers/           # По типу источника
│   │   │   │   ├── github.ts
│   │   │   │   ├── reddit.ts
│   │   │   │   ├── youtube.ts
│   │   │   │   ├── rss.ts
│   │   │   │   ├── telegram.ts
│   │   │   │   ├── notion.ts
│   │   │   │   ├── pdf.ts
│   │   │   │   └── url.ts
│   │   │   ├── prompts.ts
│   │   │   └── parser.ts
│   │   ├── export/
│   │   │   ├── obsidian.ts
│   │   │   ├── markdown.ts
│   │   │   ├── pdf.ts
│   │   │   └── notion.ts
│   │   └── billing/
│   │       └── yookassa.ts
│   ├── lib/
│   │   ├── ai/                     # Provider abstraction
│   │   │   ├── interface.ts        # AIProvider interface
│   │   │   ├── providers/
│   │   │   │   ├── groq.ts
│   │   │   │   ├── gemini.ts
│   │   │   │   └── ollama.ts
│   │   │   └── factory.ts
│   │   ├── security/
│   │   │   ├── validate.ts         # SSRF, URL validation
│   │   │   ├── encrypt.ts          # AES-256-GCM для API-ключей
│   │   │   └── ratelimit.ts        # Upstash Redis wrapper
│   │   ├── db/
│   │   │   ├── client.ts           # Prisma client singleton
│   │   │   └── repositories/       # Data access layer
│   │   ├── logger.ts               # Pino structured logging
│   │   └── utils.ts
│   ├── stores/                     # Zustand stores (UI-state only)
│   │   ├── ui.ts
│   │   ├── history.ts
│   │   └── settings.ts
│   ├── types/
│   │   ├── extraction.ts
│   │   ├── export.ts
│   │   └── api.ts
│   └── middleware.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── e2e/                            # Playwright E2E
├── tests/                          # Unit + Integration (Vitest)
├── docs/                           # Документация
└── public/

3.5 Схема базы данных (Prisma)

Модель

Ключевые поля

Назначение

User

id, email, name, passwordHash, premiumUntil, createdAt, isAdmin

Пользователи

Extraction

id, userId, title, source, sourceType, content, result (JSON), preset, model, isPinned, isShared, deletedAt, createdAt

История извлечений

Share

id, extractionId, userId, expiresAt, viewCount, createdAt

Публичные ссылки

UserApiKey

id, userId, provider (groq/gemini), encryptedKey, createdAt

Зашифрованные API-ключи

PaymentLog

id, userId, paymentId, amount, currency, status, metadata, createdAt

Журнал платежей ЮKassa

UserPreset

id, userId, name, description, promptTemplate, model, quality, createdAt

Пользовательские пресеты (v2.1)

Миграция БД:

Target: Turso (libSQL, совместим с SQLite) или Neon (PostgreSQL) — выбрать до production

Обязательно до деплоя: prisma migrate deploy через CI/CD

Backup: ежедневный снапшот через провайдера БД

3.6 Потоки данных

Поток: Извлечение контента

Шаг

Участник

Действие

1

Пользователь

Выбирает тип источника, вводит URL/текст/файл

2

InputPanel

Валидация на клиенте (не пустой, базовый формат URL)

3

POST /api/extract

Rate limit check (Redis) → auth check → premium check

4

Fetcher (source-specific)

Получение и санитизация контента источника

5

SSRF Validator

Проверка URL до fetch (если внешний ресурс)

6

AI Provider

Формирование промпта → запрос к Groq/Gemini/Ollama

7

Stream Handler

Стриминг токенов → SSE на клиент

8

Result Parser

Парсинг JSON из AI-ответа → ExtractionResult

9

Database

Запись в Extraction (если saveToHistory)

10

Webhook

POST на user webhook URL (если задан)

11

OutputPanel

Отрисовка результата по вкладкам

Поток: Премиум-экспорт (target v2.0)

Шаг

Участник

Действие

1

Пользователь

Нажимает [Экспорт → PDF/Obsidian/Markdown]

2

ExportPanel

Повторный запрос GET /api/user/premium (актуальный статус)

3

POST /api/export/{format}

Auth check → premiumUntil > now → fetch ExtractionResult by resultId

4

Export Service

Генерация файла на сервере (pdf-lib / markdown / obsidian)

5

Response

Бинарный файл в теле ответа с Content-Disposition: attachment

6

Браузер

Скачивание файла

3.7 Обработка ошибок

Сценарий

Поведение системы

UX

URL не найдена (404)

Fetcher возвращает SourceError с кодом NOT_FOUND

Toast: «Страница не найдена»

Timeout fetch (>15s)

AbortController срабатывает, retry 2x

Toast: «Превышено время ответа»

SSRF попытка

assertUrlSafeForFetch бросает исключение до fetch

Toast: «Невалидный URL»

AI API 401

Provider возвращает AuthError

Toast: «Невалидный API-ключ»; кнопка [Настройки]

AI API 429

Rate limit, backoff 1s → 3s → ошибка

Toast: «Лимит превышен, подождите»

AI timeout (>30s)

AbortController, не retry

Toast: «AI не ответил вовремя»; кнопка [Повторить]

Пустой контент

Fetcher возвращает EmptyContentError

Toast: «Контент не извлечён»

PDF > 50MB

Валидация на клиенте до upload

Toast: «Файл слишком большой (макс. 50 МБ)»

Rate limit превышен

429 с Retry-After header

Toast: «Дневной лимит исчерпан»; ссылка на Premium

Ошибка БД

Логируется с stack, клиент получает 500

Toast: «Внутренняя ошибка, попробуйте позже»

Webhook delivery fail

Логируется как warning, не блокирует UI

Тихая ошибка (не показывается пользователю)

Принципы обработки ошибок:

Fail Fast: валидация входных данных до любой I/O операции

Never Swallow: все ошибки логируются с контекстом (userId, sourceType, model)

User-Friendly: технические детали скрыты от пользователя, конкретные сообщения

Graceful Degradation: при ошибке парсинга источника — fallback на Readability (для URL)

Idempotent Retry: webhook delivery и запись в БД должны быть идемпотентны

3.8 Логирование

Инструмент: Pino (structured JSON logging). Интеграция с Sentry для ошибок production.

Уровень

События

DEBUG

Парсинг контента (размер, тип), формирование промпта, streaming chunks

INFO

Начало/конец извлечения, результат (без контента), действия пользователя, webhook delivery

WARN

Retry попытки, частичный контент, rate limit approaching, webhook 4xx

ERROR

Ошибки парсинга, AI API ошибки, ошибки БД, webhook delivery fail

FATAL

Startup ошибки, соединение с БД потеряно

Структура лог-записи:

{ "level": "info", "time": 1711234567890, "requestId": "req_abc123", "userId": "usr_xyz", "event": "extraction.complete", "sourceType": "github", "model": "llama-3.3-70b", "duration_ms": 4230, "tokens": 1842 }

3.9 Расширяемость

Добавление нового AI-провайдера

Создать src/lib/ai/providers/{name}.ts, реализовать интерфейс AIProvider

Добавить запись в src/lib/ai/factory.ts

Добавить опцию в SettingsDialog и store

Добавить /api/verify-{name} endpoint

Всё. Никаких изменений в бизнес-логике и export-сервисах.

Добавление нового источника

Создать src/services/extraction/fetchers/{source}.ts

Добавить InputType в types/extraction.ts

Зарегистрировать fetcher в фабрике fetchers/index.ts

Добавить вкладку в InputPanel

Промпты, история, экспорт — без изменений (работают с ExtractionResult).

Добавление нового формата экспорта

Создать src/services/export/{format}.ts

Добавить endpoint POST /api/export/{format}

Добавить кнопку в ExportPanel

Генератор изолирован, не влияет на другую логику.

ЧАСТЬ 4 — ROADMAP РАЗРАБОТКИ

4.1 Этапы реализации (v2.0)

Фаза

Название

Длительность

Приоритет

Phase 0

Production Blockers

1–2 нед.

КРИТИЧНО

Phase 1

Security Hardening

1–2 нед.

ВЫСОКИЙ

Phase 2

Architecture Refactoring

2–3 нед.

ВЫСОКИЙ

Phase 3

Feature Completion

2–3 нед.

СРЕДНИЙ

Phase 4

Quality & Testing

1–2 нед.

СРЕДНИЙ

Phase 5

Growth & Marketing

Ongoing

НИЗКИЙ

Phase 0 — Production Blockers (Критично)

Без этих задач production-деплой невозможен или опасен:

[ ] Миграция SQLite → Turso или Neon (Prisma adapter, env vars в CI/CD)

[x] Кластерный burst для `POST /api/extract`: Upstash Redis при `UPSTASH_REDIS_REST_*` (`distributed-rate-limit.ts`), иначе in-memory

[x] Шифрование API-ключей в БД (AES-256-GCM, `ENCRYPTION_KEY` — см. `user-api-keys-crypto.ts`)

[x] CSP + HSTS в `next.config.ts` (production)

[x] npm audit в CI — `npm audit --audit-level=critical` (`.github/workflows/ci.yml`)

Phase 1 — Security Hardening

[ ] Перенос генерации PDF/Markdown/Obsidian на сервер (/api/export/{format})

[x] API-ключи не сохраняются в persist Zustand (`partialize` обнуляет ключи)

[x] SSRF Ollama: `validateOllamaUrl` + whitelist до запрета приватных IP

[x] Retry-After header при 429 (extract, verify-groq/gemini, groq-models и др.)

[x] Sentry: `withSentryConfig` при заданном `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`

Phase 2 — Architecture Refactoring

[ ] Выделить сервисный слой: src/services/{extraction,export,billing}

[x] Provider Pattern: `src/lib/ai/providers/{groq,gemini,ollama}.ts` + `ai-providers.ts`

[x] Разбить стор на слайсы: `src/stores/slices/{ui,history,settings}-slice.ts`, сборка и persist в `src/lib/store.ts`, тип `AppState` в `src/stores/app-state.ts`

[x] Repository pattern для Prisma: `src/lib/db/repositories/` (share, user, billing; подключено к share, premium, grant/revoke, webhook ЮKassa, admin payments — остальные handlers постепенно)

[x] Pino: `src/lib/logger.ts` (уровень через `SENSIFY_LOG_LEVEL`; расширение userId — по мере надобности)

Phase 3 — Feature Completion

[x] Sidebar: вкладки Recent / Saved / Trash (isPinned, deletedAt; локально); Shared — отдельно при backend

[x] Share: expiresAt в БД, проверка при GET /api/share/[id], настройка срока в UI (Настройки → Аккаунт)

[x] Export: retry кнопка в OutputPanel при ошибке AI

[ ] Пользовательские пресеты: синхронизация с аккаунтом (БД)

[x] Input validation: красная обводка полей при ошибке (zod + UI feedback)

[ ] Уведомления: bell icon в header с базовым списком (новая фича, оплата)

[x] YouTube / Notion: убрать в «Ещё» (dropdown)

Phase 4 — Quality & Testing

[ ] E2E Playwright: полные user journeys (список из FR-05 NFR-03)

[ ] Unit тесты (Vitest): старт — `share-expiry`, `validateOllamaUrl`; дальше fetchers, prompts, exporters — цель 80%+

[ ] WCAG AA audit: контраст токенов, keyboard nav, aria-live на output

[ ] Lighthouse CI: ≥85 Performance, ≥90 Accessibility в pipeline

[ ] Виртуализация длинных списков в HistorySidebar (>100 элементов)

Phase 5 — Growth (Ongoing)

[ ] Контент-маркетинг: dev Twitter/X, HN, Reddit под dev-нишу

[ ] Лендинг /developers с примерами и скриншотами

[ ] Notion export в database с кастомными полями (не только child page)

[ ] Кластерный global rate limit через Redis

[ ] Server-Sent Events / WebSocket для real-time уведомлений

ЧАСТЬ 5 — КРИТИКА И СТРАТЕГИЧЕСКИЕ УЛУЧШЕНИЯ

5.1 Ключевые проблемы текущего проекта

Проблема 1: SQLite в production — архитектурный долг

Серьёзность: КРИТИЧЕСКАЯ. SQLite на диске несовместим с serverless деплоем (Vercel), Docker multi-replica и любым горизонтальным масштабированием. Это не «техдолг» — это блокер production. Решение: Turso (минимальные правки Prisma) или Neon (миграция provider на postgresql). Срок: до первого production-деплоя.

Проблема 2: API-ключи в localStorage

Серьёзность: ВЫСОКАЯ. Groq и Gemini API-ключи персистируются в localStorage через Zustand. При XSS-атаке (даже через content injection в Markdown-рендере) злоумышленник получает ключи. Решение: шифровать ключи в БД (AES-256-GCM), в клиенте хранить только флаг «ключ сохранён», никогда не передавать ключ обратно на клиент.

Проблема 3: Документация → Production Gap

Серьёзность: СРЕДНЯЯ. Документация превосходна по объёму и структуре, но разрыв между «описано» и «реализовано» большой. STATUS.md честно фиксирует это, но без приоритизации и оценок трудоёмкости документация превращается в wishlist. Решение: перенести бэклог в GitHub Issues с labels (priority, effort), привязать к milestone v2.0.

Проблема 4: Монолитный store.ts

Серьёзность: СРЕДНЯЯ. Единый Zustand store содержит UI-state, настройки AI, историю, API-ключи, флаги сессии. Это затрудняет тестирование, увеличивает размер persist-бандла и смешивает ответственности. Решение: разбить на 3 стора: ui.ts (тема, sidebar), settings.ts (AI провайдер, язык, качество — без ключей), history.ts.

Проблема 5: Отсутствие unit-тестов

Серьёзность: СРЕДНЯЯ. Проект не имеет unit-тестов. Fetchers (GitHub, Reddit, RSS), промпты, SSRF-валидатор, exporters — критический код без coverage. Любой рефакторинг — риск регрессии. Решение: Vitest для быстрых unit-тестов. Start with: validate.ts, prompts.ts, fetchers/*.ts — 80% coverage.

Проблема 6: Смешение ответственностей в TZ_SENSIFY_FUNCTIONALITY.md

Серьёзность: НИЗКАЯ. Один файл содержит требования, статус, примеры запросов, тестовые данные. Это антипаттерн: при изменении требований меняется и статус, и наоборот. Решение: разделить на REQUIREMENTS.md (что должно быть) и STATUS.md (что есть). Уже частично сделано, нужно завершить.

5.2 Как превратить в продукт уровня рынка

1. Надёжность (Reliability)

Конкуренты (NotebookLM, Readwise Reader) имеют SLO 99.9%. Для достижения: облачная БД с репликацией, distributed rate limiting, Sentry для error tracking, Lighthouse CI в pipeline, health-check endpoint (/api/health). Без этого продукт не воспринимается как серьёзный.

2. Дифференциация (Differentiation)

Ключевое УТП Sensify — privacy-first (Ollama) + developer workflow (GitHub Issues → Obsidian). Это то, чего нет у NotebookLM. Нужно сделать Ollama-путь первоклассным: UI-гайд по установке прямо в приложении, тест соединения, список рекомендуемых моделей по задаче.

3. Retention (Удержание пользователей)

Текущая история — в localStorage (без аккаунта теряется). Нужно активнее вести пользователей к регистрации: «Создайте аккаунт, чтобы не потерять 12 сохранённых извлечений». Sidebar с Saved / Trash — это retention feature. Email-уведомления (weekly digest из истории) — долгосрочный retention.

4. Developer Experience (DX)

Webhook-документация хорошая. Следующий шаг — публичный API (/api/v1/extract) с API-ключом (не NextAuth сессией), документация OpenAPI/Swagger. Это открывает B2B-сегмент: команды, автоматизация пайплайнов, CI-интеграции.

5. Монетизация (Monetization)

Текущая модель: freemium с лимитами + ЮKassa. Проблема: лимит 10/день для авторизованных — мало для активного разработчика, много для casual user. Рассмотреть: Free 5/day → Pro (unlimited + Obsidian/PDF) → Team (shared history, API access). Godmode-тариф для heavy users с приоритетным Groq.

— КОНЕЦ ДОКУМЕНТА —

Sensify Technical Specification v2.0  |  Конфиденциально