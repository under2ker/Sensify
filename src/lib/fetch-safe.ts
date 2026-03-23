/**
 * Безопасный fetch с таймаутом и retry для внешних вызовов.
 * Используется для Groq, Ollama, URL-загрузок, ЮKassa и т.д.
 */

export interface FetchOptions extends Omit<RequestInit, "signal"> {
  /** Таймаут в мс (по умолчанию 60000 для API, 30000 для URL) */
  timeout?: number;
  /** Количество повторных попыток при 5xx или сетевых ошибках */
  retries?: number;
  /** Задержка между попытками в мс */
  retryDelay?: number;
}

const DEFAULT_TIMEOUT = 60000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000;

function isRetryable(status: number, err: Error): boolean {
  if (status >= 500 && status < 600) return true;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("enotfound") ||
    msg.includes("network") ||
    msg.includes("fetch failed")
  );
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: FetchOptions
): Promise<Response> {
  const timeout = init?.timeout ?? DEFAULT_TIMEOUT;
  const retries = init?.retries ?? DEFAULT_RETRIES;
  const retryDelay = init?.retryDelay ?? DEFAULT_RETRY_DELAY;

  let lastError: Error | null = null;
  let lastRes: Response | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (attempt < retries && isRetryable(res.status, new Error(`HTTP ${res.status}`))) {
        lastRes = res;
        await new Promise((r) => setTimeout(r, retryDelay * (attempt + 1)));
        continue;
      }

      return res;
    } catch (err) {
      clearTimeout(id);
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < retries && isRetryable(0, lastError)) {
        await new Promise((r) => setTimeout(r, retryDelay * (attempt + 1)));
        continue;
      }

      throw lastError;
    }
  }

  if (lastRes) return lastRes;
  throw lastError ?? new Error("Fetch failed");
}

/** Таймаут по умолчанию для загрузки веб-страниц (короче) */
export const URL_FETCH_TIMEOUT = 25000;
