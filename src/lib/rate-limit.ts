/**
 * Rate limit для регистрации: 5 попыток в час с одного IP.
 * Использует таблицу RegisterAttempt в БД.
 */

import { prisma } from "@/lib/prisma";

const REGISTER_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 час

export async function checkRegisterRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const since = new Date(Date.now() - WINDOW_MS);
  const count = await prisma.registerAttempt.count({
    where: { ip, createdAt: { gte: since } },
  });
  const allowed = count < REGISTER_LIMIT;
  const remaining = Math.max(0, REGISTER_LIMIT - 1 - count);
  return { allowed, remaining };
}

export async function recordRegisterAttempt(ip: string): Promise<void> {
  await prisma.registerAttempt.create({
    data: { ip },
  });
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return request.headers.get("x-vercel-forwarded-for");
}
