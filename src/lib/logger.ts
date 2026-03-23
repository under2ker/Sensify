/**
 * Структурированный логгер на Pino.
 *
 * JSON-строки в stdout (dev и production). Без `transport` / worker — иначе Next.js
 * даёт MODULE_NOT_FOUND на `worker.js` в `.next/server/vendor-chunks`.
 *
 * Уровень: SENSIFY_LOG_LEVEL = debug | info | warn | error (по умолчанию info).
 */

import pino from "pino";

const level = (process.env.SENSIFY_LOG_LEVEL ?? process.env.PKE_LOG_LEVEL ?? "info").toLowerCase();

const pinoInstance = pino(
  {
    level,
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  },
  pino.destination(1)
);

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

  userAction(route: string, reqId: string, userId: string, msg: string) {
    pinoInstance.info({ route, reqId, userId, event: "user_action" }, msg);
  },
};
