import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDistributedRateLimitEnabled } from "@/lib/distributed-rate-limit";

function paymentsConfigured(): boolean {
  const shop = process.env.YOOKASSA_SHOP_ID?.trim();
  const secret = process.env.YOOKASSA_SECRET_KEY?.trim();
  return Boolean(shop && secret);
}

/** Согласовано с `create-prisma-client.ts`: LibSQL-адаптер vs обычный SQLite. */
function databaseBackend(): "turso" | "sqlite" {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL?.trim() ||
    (process.env.DATABASE_URL?.startsWith("libsql:") ? process.env.DATABASE_URL.trim() : undefined);
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (tursoUrl && tursoToken) return "turso";
  return "sqlite";
}

/**
 * Health check для мониторинга.
 * GET /api/health — БД, метки времени; `paymentsConfigured` — ЮKassa; `databaseBackend` — turso | sqlite;
 * `rateLimitDistributed` — заданы UPSTASH_* (общий burst/verify между инстансами).
 */
export async function GET() {
  const start = Date.now();
  const pay = paymentsConfigured();
  const backend = databaseBackend();
  const rateLimitDistributed = isDistributedRateLimitEnabled();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return NextResponse.json({
      ok: true,
      database: "ok",
      databaseBackend: backend,
      rateLimitDistributed,
      paymentsConfigured: pay,
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        databaseBackend: backend,
        rateLimitDistributed,
        paymentsConfigured: pay,
        error: process.env.NODE_ENV === "development" ? String(e) : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
