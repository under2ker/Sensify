# База данных в production (несколько инстансов)

Сейчас по умолчанию **SQLite** (`prisma/schema.prisma`, `DATABASE_URL=file:./dev.db`). Для **Vercel / нескольких контейнеров** файловая БД на диске инстанса не подходит: нет общего диска и согласованных блокировок между репликами.

## Что уже сделано в коде

| Компонент | Файл / поведение |
|-----------|------------------|
| **Turso (LibSQL) в runtime** | `src/lib/create-prisma-client.ts`: при `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (или `DATABASE_URL` с префиксом `libsql:` + тот же токен) создаётся `PrismaClient` с `@prisma/adapter-libsql`. |
| **Локальная разработка** | `DATABASE_URL="file:./dev.db"` без пары URL+токен Turso → обычный Prisma без адаптера. |
| **Мониторинг** | `GET /api/health` возвращает `databaseBackend`: `"turso"` \| `"sqlite"`, `rateLimitDistributed` (см. ниже). |

**Схема (актуально для prod push):** помимо базовых моделей — `Share.userId` (nullable), таблица **`user_presets`** (снимок «Мои пресеты» на пользователя). После обновления кода выполните `npx prisma db push` (или migrate) на целевой БД.

Переменные см. **`.env.example`**.

---

## Варианты провайдеров

| Сервис | Примечание |
|--------|------------|
| **Turso** | LibSQL, схема как у SQLite, минимальные отличия; рекомендуемый путь для этого репозитория |
| **Neon / Supabase / PlanetScale** | PostgreSQL или MySQL — смена `provider` в Prisma и новые миграции |
| **Railway / Fly.io** | Один инстанс + том — SQLite возможен только при малом трафике и одной реплике |

---

## Пошагово: Turso + Vercel

1. **Аккаунт и база** — [Turso](https://turso.tech/): создайте БД (например `sensify-prod`), скопируйте **URL** вида `libsql://….turso.io`.
2. **Токен** — в CLI `turso db tokens create <имя-db>` или в консоли Turso; значение храните только в секретах.
3. **Переменные на Vercel** (Settings → Environment Variables):

   | Переменная | Значение |
   |------------|----------|
   | `TURSO_DATABASE_URL` | `libsql://…` |
   | `TURSO_AUTH_TOKEN` | токен доступа |
   | `DATABASE_URL` | **не** `file:…` на проде. Можно продублировать `libsql://…` или оставить пустым/заглушкой — runtime берёт пару `TURSO_*` из `create-prisma-client.ts`. Убедитесь, что в билде/рантайме нет случайного `file:./dev.db` из кэша env. |

   Дополнительно: `AUTH_SECRET`, `NEXTAUTH_URL`, ключи AI, при необходимости ЮKassa — как в README.

4. **Применение схемы к облаку** — в репозитории история миграций Prisma может отличаться от вашего процесса; типичные варианты:
   - **`prisma db push`** с временной подстановкой в окружение `DATABASE_URL`/`TURSO_*` на машине, с которой есть доступ в интернет к Turso (см. [документацию Prisma + Turso](https://www.prisma.io/docs/orm/overview/databases/turso));
   - либо SQL из схемы через консоль Turso / CLI, если политика команды так проще.

   После первого применения схемы проверьте вход, регистрацию и `/api/health` (`database: "ok"`, `databaseBackend: "turso"`).

5. **Резервное копирование** — включите по инструкции Turso (point-in-time / export).

---

## Rate limit между инстансами

Burst на `POST /api/extract` и лимиты на `verify-groq` / `verify-gemini` используют **`src/lib/distributed-rate-limit.ts`**: при заданных **`UPSTASH_REDIS_REST_URL`** и **`UPSTASH_REDIS_REST_TOKEN`** счётчики общие для всех инстансов (Upstash Redis). Иначе — in-memory внутри процесса.

Подробнее — [`PERFORMANCE_NOTES.md`](./PERFORMANCE_NOTES.md), указатель — [`PLANNED_FEATURES.md`](./PLANNED_FEATURES.md).

---

## После смены БД

- **NextAuth** с Prisma adapter — без смены моделей менять код не нужно.
- **SQLite → Turso**: перенос данных вручную (export/import) или с нуля для нового окружения.

---

## Мониторинг деплоя

`GET /api/health`:

- `database` — `ok` / `error`
- `databaseBackend` — `turso` или `sqlite` (как сконфигурирован процесс)
- `rateLimitDistributed` — `true`, если заданы Upstash-переменные
- `paymentsConfigured` — заданы ли ключи ЮKassa (см. [`YOOKASSA_PAYMENTS.md`](./YOOKASSA_PAYMENTS.md))
