# Прогресс по TZ Production Edition

Опорный документ: [`TZ_PRODUCTION_EDITION.md`](./TZ_PRODUCTION_EDITION.md).  
Сводка по коду: [`STATUS.md`](./STATUS.md).

## Phase 0 — Production Blockers

| Задача | Статус | Комментарий |
|--------|--------|-------------|
| SQLite → Turso / Neon | ⏳ Не начато | Инструкция: [`DATABASE_PRODUCTION.md`](./DATABASE_PRODUCTION.md) |
| In-memory → Redis rate limit | 🟡 Частично | При `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` burst на `POST /api/extract` и verify-* идут через Upstash; иначе как раньше in-memory (`distributed-rate-limit.ts`) |
| Шифрование API-ключей в БД | 🟡 Частично | При `ENCRYPTION_KEY` (32 byte, hex64 или base64) ключи Groq/Gemini шифруются AES-256-GCM (`user-api-keys-crypto.ts`). Без env — поведение как раньше (plain). После включения ключа пересохраните ключи в настройках, если старые записи были plain |
| CSP в next.config | ✅ Сделано | Production: `Content-Security-Policy` + базовые security headers (`next.config.ts`) |
| npm audit в CI | ✅ Сделано | `npm audit --audit-level=critical` без `continue-on-error` (`.github/workflows/ci.yml`) |

## Phase 1+

Не начато — см. чеклист в `TZ_PRODUCTION_EDITION.md` §4.1.

## Переменные окружения (Phase 0)

См. `.env.example`: `ENCRYPTION_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `UPSTASH_REDIS_REST_URL`.

Генерация ключа: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

*Обновляйте таблицу по мере движения по roadmap.*
