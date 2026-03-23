/**
 * Простые валидаторы для API-входных данных.
 * Без тяжёлых зависимостей (Zod и т.д.) — минимальный набор для безопасности.
 */

import { ValidationError } from "@/lib/errors";

export function requireString(value: unknown, field: string, maxLen = 100_000): string {
  if (value == null || value === "") {
    throw new ValidationError(`Поле "${field}" обязательно`);
  }
  const s = String(value).trim();
  if (!s) throw new ValidationError(`Поле "${field}" не может быть пустым`);
  if (s.length > maxLen) throw new ValidationError(`Поле "${field}" слишком длинное`);
  return s;
}

export function requireUrl(value: unknown, field = "url"): string {
  const s = requireString(value, field, 2048);
  try {
    const u = new URL(s);
    if (!["http:", "https:"].includes(u.protocol)) {
      throw new ValidationError(`Недопустимый протокол в ${field}`);
    }
    return s;
  } catch (e) {
    if (e instanceof ValidationError) throw e;
    throw new ValidationError(`Некорректный URL в поле "${field}"`);
  }
}

/** Блокирует SSRF: localhost, private, link-local, cloud metadata. */
export function assertUrlSafeForFetch(urlString: string, field = "url"): void {
  try {
    const u = new URL(urlString);
    const hostname = u.hostname.toLowerCase();
    const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"];
    if (blocked.includes(hostname)) {
      throw new ValidationError(`Запросы к внутренним адресам (${field}) запрещены`);
    }
    if (hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
      throw new ValidationError(`Запросы к внутренним адресам (${field}) запрещены`);
    }
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (a === 0) throw new ValidationError(`Запросы к 0.x.x.x (${field}) запрещены`);
      if (a === 10) throw new ValidationError(`Запросы к приватным сетям (${field}) запрещены`);
      if (a === 100 && b >= 64 && b <= 127) throw new ValidationError(`Запросы к Carrier-grade NAT (${field}) запрещены`);
      if (a === 127) throw new ValidationError(`Запросы к loopback (${field}) запрещены`);
      if (a === 169 && b === 254) throw new ValidationError(`Запросы к link-local / cloud metadata (${field}) запрещены`);
      if (a === 172 && b >= 16 && b <= 31) throw new ValidationError(`Запросы к приватным сетям (${field}) запрещены`);
      if (a === 192 && b === 168) throw new ValidationError(`Запросы к приватным сетям (${field}) запрещены`);
    }
    const bare = hostname.replace(/^\[|\]$/g, "");
    if (bare.startsWith("fc") || bare.startsWith("fd") || bare.startsWith("fe80") || bare === "::1" || bare === "::") {
      throw new ValidationError(`Запросы к внутренним IPv6 (${field}) запрещены`);
    }
  } catch (e) {
    if (e instanceof ValidationError) throw e;
    throw new ValidationError(`Некорректный URL в поле "${field}"`);
  }
}

/** URL для fetch: проверка формата + защита от SSRF */
export function requireSafeUrl(value: unknown, field = "url"): string {
  const s = requireUrl(value, field);
  assertUrlSafeForFetch(s, field);
  return s;
}

export function optionalString(value: unknown, field: string, maxLen = 50_000): string | undefined {
  if (value == null || value === "") return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  if (s.length > maxLen) throw new ValidationError(`Поле "${field}" слишком длинное`);
  return s;
}

export function requireOneOf<T>(value: unknown, options: readonly T[], field: string): T {
  if (!options.includes(value as T)) {
    throw new ValidationError(`Поле "${field}" должно быть одним из: ${options.join(", ")}`);
  }
  return value as T;
}

export function requireArray(value: unknown, field: string, itemValidator?: (v: unknown) => unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`Поле "${field}" должно быть массивом`);
  }
  if (itemValidator) {
    value.forEach((item, i) => {
      try {
        itemValidator(item);
      } catch {
        throw new ValidationError(`Некорректный элемент в "${field}" на позиции ${i + 1}`);
      }
    });
  }
  return value;
}

/**
 * Валидация ollamaUrl: только localhost / 127.0.0.1 или origin из OLLAMA_URL_WHITELIST.
 * Путь ограничен до /api/* (Ollama REST API), user-info и фрагменты запрещены.
 */
export function validateOllamaUrl(urlString: string): string {
  const u = urlString.trim();
  if (!u) return "http://localhost:11434";
  try {
    const parsed = new URL(u);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new ValidationError("Ollama URL: допустимы только http или https");
    }
    if (parsed.username || parsed.password) {
      throw new ValidationError("Ollama URL: user-info запрещён");
    }
    const host = parsed.hostname.toLowerCase();

    const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (isLocalhost) return parsed.origin;

    if (host === "0.0.0.0") {
      throw new ValidationError("Ollama URL: 0.0.0.0 запрещён, используйте localhost или 127.0.0.1");
    }

    const parsedOrigin = parsed.origin.toLowerCase();
    const raw = process.env.OLLAMA_URL_WHITELIST || "";
    const allowed = raw.split(",").map((s) => s.trim()).filter(Boolean);
    for (const w of allowed) {
      try {
        if (new URL(w).origin.toLowerCase() === parsedOrigin) return parsed.origin;
      } catch {
        /* skip invalid whitelist entry */
      }
    }

    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const a = Number(ipv4Match[1]);
      const b = Number(ipv4Match[2]);
      if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127) {
        throw new ValidationError("Ollama URL: приватные IP разрешены только через OLLAMA_URL_WHITELIST");
      }
      if (a === 169 && b === 254) {
        throw new ValidationError("Ollama URL: link-local / cloud metadata запрещены");
      }
    }
    const bare = host.replace(/^\[|\]$/g, "");
    if (bare.startsWith("fc") || bare.startsWith("fd") || bare.startsWith("fe80")) {
      throw new ValidationError("Ollama URL: приватные IPv6 разрешены только через OLLAMA_URL_WHITELIST");
    }

    throw new ValidationError(
      "Ollama URL доступен только для localhost. Для внешних серверов укажите OLLAMA_URL_WHITELIST в .env"
    );
  } catch (e) {
    if (e instanceof ValidationError) throw e;
    throw new ValidationError("Некорректный URL Ollama");
  }
}
