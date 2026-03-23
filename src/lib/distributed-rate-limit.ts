/**
 * Rate limit: Upstash Redis при заданных UPSTASH_* — иначе in-memory (один инстанс).
 * См. docs/TZ_PRODUCTION_EDITION.md Phase 0.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  checkMemoryRateLimit,
  type MemoryRateLimitResult,
} from "@/lib/memory-rate-limit";

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    redisClient = null;
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

const limiterCache = new Map<string, Ratelimit>();

function getSlidingLimiter(
  namespace: string,
  max: number,
  windowSec: number
): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const cacheKey = `${namespace}:${max}:${windowSec}`;
  let lim = limiterCache.get(cacheKey);
  if (!lim) {
    lim = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
      prefix: `@sensify/rl/${namespace}`,
    });
    limiterCache.set(cacheKey, lim);
  }
  return lim;
}

/**
 * @param windowMs — длина окна (как в memory-rate-limit); для Redis округляется вверх до секунд
 */
export async function checkDistributedRateLimit(
  identity: string,
  namespace: string,
  maxRequests: number,
  windowMs: number
): Promise<MemoryRateLimitResult> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const limiter = getSlidingLimiter(namespace, maxRequests, windowSec);
  if (!limiter) {
    return checkMemoryRateLimit(identity, namespace, maxRequests, windowMs);
  }
  const id = identity.slice(0, 256);
  const { success, reset } = await limiter.limit(id);
  if (success) return { ok: true };
  const waitMs = Math.max(0, reset - Date.now());
  return {
    ok: false,
    retryAfterSec: Math.max(1, Math.ceil(waitMs / 1000)),
  };
}

export function isDistributedRateLimitEnabled(): boolean {
  return getRedis() !== null;
}
