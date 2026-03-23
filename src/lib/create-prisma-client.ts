import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

function prismaLog(): Prisma.LogLevel[] | undefined {
  return process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
}

/**
 * Локально: `DATABASE_URL=file:./dev.db` без токена → обычный Prisma (SQLite).
 * Production (Turso): `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`, либо `DATABASE_URL=libsql://...` + токен.
 */
export function createPrismaClient(): PrismaClient {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL?.trim() ||
    (process.env.DATABASE_URL?.startsWith("libsql:") ? process.env.DATABASE_URL.trim() : undefined);
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (tursoUrl && tursoToken) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return new PrismaClient({
      adapter,
      log: prismaLog(),
    });
  }

  return new PrismaClient({
    log: prismaLog(),
  });
}
