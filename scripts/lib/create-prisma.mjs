/**
 * Дублирует логику `src/lib/create-prisma-client.ts` для Node-скриптов без TS.
 * При изменении условий Turso — обновить оба файла.
 */
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

export function createPrismaClient() {
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
      log: ["error", "warn"],
    });
  }

  return new PrismaClient({
    log: ["error", "warn"],
  });
}
