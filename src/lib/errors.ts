/**
 * Система типизированных ошибок приложения.
 * Разделение: пользовательские, валидация, сеть, системные.
 * Не раскрывать технические детали в userMessage при production.
 */

export const ERROR_CODES = {
  VALIDATION: "VALIDATION",
  USER: "USER",
  NETWORK: "NETWORK",
  EXTERNAL_SERVICE: "EXTERNAL_SERVICE",
  SYSTEM: "SYSTEM",
  AUTH: "AUTH",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMIT: "RATE_LIMIT",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface AppErrorOptions {
  code?: ErrorCode;
  /** Сообщение для пользователя (показывается в UI) */
  userMessage?: string;
  /** HTTP статус для API */
  statusCode?: number;
  /** Внутренние данные для логов (не показывать пользователю) */
  context?: Record<string, unknown>;
}

/** Базовый класс ошибок приложения */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly statusCode: number;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options: AppErrorOptions = {}
  ) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? ERROR_CODES.SYSTEM;
    this.userMessage = options.userMessage ?? message;
    this.statusCode = options.statusCode ?? 500;
    this.context = options.context;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      error: this.userMessage,
      code: this.code,
      ...(process.env.NODE_ENV === "development" && { internal: this.message }),
    };
  }
}

/** Ошибка валидации входных данных */
export class ValidationError extends AppError {
  constructor(message: string, options?: Omit<AppErrorOptions, "code">) {
    super(message, { ...options, code: ERROR_CODES.VALIDATION, statusCode: options?.statusCode ?? 400 });
    this.name = "ValidationError";
  }
}

/** Пользовательская ошибка (некорректный запрос, недостаточно данных) */
export class UserError extends AppError {
  constructor(message: string, options?: Omit<AppErrorOptions, "code">) {
    super(message, { ...options, code: ERROR_CODES.USER, statusCode: options?.statusCode ?? 400 });
    this.name = "UserError";
  }
}

/** Сетевая ошибка (timeout, connect failed, etc.) */
export class NetworkError extends AppError {
  constructor(message: string, options?: Omit<AppErrorOptions, "code">) {
    super(message, { ...options, code: ERROR_CODES.NETWORK, statusCode: options?.statusCode ?? 502 });
    this.name = "NetworkError";
  }
}

/** Ошибка внешнего сервиса (Groq, Ollama, ЮKassa и т.д.) */
export class ExternalServiceError extends AppError {
  constructor(message: string, options?: Omit<AppErrorOptions, "code">) {
    super(message, { ...options, code: ERROR_CODES.EXTERNAL_SERVICE, statusCode: options?.statusCode ?? 502 });
    this.name = "ExternalServiceError";
  }
}

/** Ошибка аутентификации */
export class AuthError extends AppError {
  constructor(message: string, options?: Omit<AppErrorOptions, "code">) {
    super(message, { ...options, code: ERROR_CODES.AUTH, statusCode: options?.statusCode ?? 401 });
    this.name = "AuthError";
  }
}

/** Ресурс не найден */
export class NotFoundError extends AppError {
  constructor(message: string, options?: Omit<AppErrorOptions, "code">) {
    super(message, { ...options, code: ERROR_CODES.NOT_FOUND, statusCode: options?.statusCode ?? 404 });
    this.name = "NotFoundError";
  }
}

/** Превышен лимит (402 Payment Required, 429 Too Many Requests) */
export class RateLimitError extends AppError {
  constructor(message: string, options?: Omit<AppErrorOptions, "code">) {
    super(message, { ...options, code: ERROR_CODES.RATE_LIMIT, statusCode: options?.statusCode ?? 429 });
    this.name = "RateLimitError";
  }
}

/** Преобразует любое исключение в AppError */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes("fetch") || msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT") || msg.includes("network"))
      return new NetworkError(msg, { context: { original: err.stack } });
    return new AppError(msg, { userMessage: msg, context: { original: err.stack } });
  }
  return new AppError("Неизвестная ошибка", { context: { raw: err } });
}
