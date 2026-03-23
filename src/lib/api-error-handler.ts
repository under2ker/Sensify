/**
 * Централизованная обработка ошибок в API routes.
 * Преобразует исключения в NextResponse с корректным статусом и user-friendly сообщением.
 */

import { NextResponse } from "next/server";
import { toAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export function handleApiError(err: unknown, route: string, reqId?: string): NextResponse {
  const appErr = toAppError(err);
  const id = reqId ?? Math.random().toString(36).slice(2, 8);

  logger.error(route, id, appErr.userMessage, appErr);
  if (appErr.context) logger.debug(route, "Context", appErr.context);

  const isDev = process.env.NODE_ENV === "development";
  const body = {
    error: appErr.userMessage,
    ...(isDev && { code: appErr.code, internal: appErr.message }),
  };

  return NextResponse.json(body, { status: appErr.statusCode });
}

/** Обёртка для API handlers — ловит исключения и возвращает NextResponse */
export function withErrorHandler<T>(
  fn: () => Promise<NextResponse>,
  route: string,
  reqId?: string
): Promise<NextResponse> {
  return fn().catch((err) => handleApiError(err, route, reqId));
}
