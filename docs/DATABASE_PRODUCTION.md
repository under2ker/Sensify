# База данных в production (несколько инстансов)

Сейчас по умолчанию **SQLite** (`prisma/schema.prisma`, `DATABASE_URL=file:./dev.db`). Для **Vercel / нескольких контейнеров** файловая БД не подходит: нет общего диска и блокировок между инстансами.

## Варианты

| Сервис | Примечание |
|--------|------------|
| **Turso** | LibSQL, похож на SQLite, минимальные правки схемы; `DATABASE_URL` с `libsql://` |
| **Neon / Supabase / PlanetScale** | PostgreSQL или MySQL — смена `provider` в Prisma и миграции |
| **Railway / Fly.io** | Один инстанс + том — можно оставить SQLite только для малого трафика |

## Turso + Prisma (краткий план)

1. Создать БД в [Turso](https://turso.tech/), получить URL и токен.
2. Установить адаптер Prisma для LibSQL (см. актуальную [документацию Prisma + Turso](https://www.prisma.io/docs/orm/overview/databases/turso)).
3. Заменить `datasource` в `schema.prisma` на провайдер `sqlite` + драйвер LibSQL **или** перейти на рекомендуемый в доках вариант для вашей версии Prisma.
4. `prisma migrate deploy` (или `db push` на первом этапе) против облачной БД.
5. В CI/CD и Vercel задать `DATABASE_URL` и секреты без коммита в репозиторий.

## После смены БД

- Проверить **NextAuth** (сессии в БД через Prisma adapter — без изменений, если модели те же).
- **Резервное копирование**: включить по инструкции провайдера.
- **Rate limit** in-memory остаётся per-instance; для единого лимита — Redis/KV (см. `docs/PERFORMANCE_NOTES.md`).

Подробности сценариев — в `docs/PLANNED_FEATURES.md` и `README.md` (раздел про деплой).
