import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check для мониторинга.
 * GET /api/health — проверка доступности приложения и БД.
 */
export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return NextResponse.json({
      ok: true,
      database: "ok",
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        error: process.env.NODE_ENV === "development" ? String(e) : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
