/**
 * Простой лимит запросов в памяти процесса (фиксированное окно).
 * Для serverless / нескольких инстансов не даёт общий лимит — см. docs/PLANNED_FEATURES.md.
 */

const store = new Map<string, { count: number; windowStart: number }>();

/** Удаляем «старые» окна, чтобы Map не росла бесконечно на долгоживущем процессе. */
const PRUNE_EVERY_MS = 45_000;
const STALE_AFTER_MS = 180_000; // > любого окна лимита в проекте
let lastPruneAt = 0;

function pruneStaleBuckets(now: number): void {
  if (now - lastPruneAt < PRUNE_EVERY_MS || store.size < 150) return;
  lastPruneAt = now;
  for (const [key, slot] of store.entries()) {
    if (now - slot.windowStart > STALE_AFTER_MS) {
      store.delete(key);
    }
  }
}

export type MemoryRateLimitResult = {
  ok: boolean;
  /** Секунды до сброса окна (для Retry-After) */
  retryAfterSec?: number;
};

/**
 * @param identity — например IP
 * @param namespace — уникальное имя эндпоинта
 */
export function checkMemoryRateLimit(
  identity: string,
  namespace: string,
  maxRequests: number,
  windowMs: number
): MemoryRateLimitResult {
  const key = `${namespace}:${identity}`;
  const now = Date.now();
  pruneStaleBuckets(now);
  let slot = store.get(key);
  if (!slot || now - slot.windowStart >= windowMs) {
    slot = { count: 0, windowStart: now };
    store.set(key, slot);
  }
  slot.count += 1;
  if (slot.count > maxRequests) {
    const waitMs = Math.max(0, windowMs - (now - slot.windowStart));
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil(waitMs / 1000)) };
  }
  return { ok: true };
}
