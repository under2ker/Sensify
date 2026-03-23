/**
 * Структурированный логгер на Pino.
 *
 * Production  → JSON (для log-агрегаторов: Datadog, Sentry, Vercel Logs).
 * Development → цветной human-readable вывод (ANSI).
 *
 * Уровень: SENSIFY_LOG_LEVEL = debug | info | warn | error (по умолчанию info).
 */

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const pinoInstance = pino({
  level: (process.env.SENSIFY_LOG_LEVEL ?? process.env.PKE_LOG_LEVEL ?? "info").toLowerCase(),
  ...(isDev
    ? {
        transport: {
          target: "pino/file",
          options: { destination: 1 },
        },
        formatters: {
          level: (label: string) => ({ level: label }),
        },
      }
    : {
        formatters: {
          level: (label: string) => ({ level: label }),
        },
      }),
});

export const logger = {
  api(route: string, reqId: string, msg: string) {
    pinoInstance.info({ route, reqId, event: "api_request" }, msg);
  },

  success(route: string, reqId: string, msg: string) {
    pinoInstance.info({ route, reqId, event: "success" }, msg);
  },

  warn(route: string, msg: string, context?: Record<string, unknown>) {
    pinoInstance.warn({ route, event: "warning", ...context }, msg);
  },

  error(route: string, reqId: string, msg: string, err?: unknown) {
    pinoInstance.error(
      { route, reqId, event: "error", err: err instanceof Error ? err.message : err },
      msg,
    );
  },

  critical(route: string, msg: string, err?: unknown) {
    pinoInstance.fatal(
      { route, event: "critical", err: err instanceof Error ? err.message : err },
      msg,
    );
  },

  info(tag: string, msg: string) {
    pinoInstance.info({ route: tag, event: "info" }, msg);
  },

  debug(route: string, msg: string, data?: unknown) {
    pinoInstance.debug({ route, event: "debug", data }, msg);
  },

  /** Лог с userId — для действий авторизованных пользователей */
  userAction(route: string, reqId: string, userId: string, msg: string) {
    pinoInstance.info({ route, reqId, userId, event: "user_action" }, msg);
  },
};
