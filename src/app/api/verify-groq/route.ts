import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getClientIp } from "@/lib/rate-limit";
import { checkDistributedRateLimit } from "@/lib/distributed-rate-limit";

const VERIFY_GROQ_PER_MINUTE = 40;

export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  logger.api("VERIFY-GROQ", reqId, "Проверка API-ключа");

  const ip = getClientIp(request) ?? "unknown";
  const rl = await checkDistributedRateLimit(
    ip,
    "verify-groq",
    VERIFY_GROQ_PER_MINUTE,
    60_000
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много проверок с этого адреса. Подождите минуту." },
      {
        status: 429,
        headers: rl.retryAfterSec
          ? { "Retry-After": String(rl.retryAfterSec) }
          : undefined,
      }
    );
  }

  try {
    const { apiKey } = await request.json();
    const key = apiKey || process.env.GROQ_API_KEY;

    if (!key || typeof key !== "string") {
      logger.error("VERIFY-GROQ", reqId, "API-ключ не указан");
      return NextResponse.json(
        { error: "API-ключ не указан" },
        { status: 400 }
      );
    }

    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: "OK" }],
          max_tokens: 5,
        }),
      }
    );

    if (res.status === 401) {
      logger.error("VERIFY-GROQ", reqId, "Неверный API-ключ");
      return NextResponse.json(
        { error: "Неверный API-ключ" },
        { status: 401 }
      );
    }

    if (res.status === 429) {
      logger.error("VERIFY-GROQ", reqId, "Превышен лимит запросов");
      const retryAfter = res.headers.get("retry-after");
      return NextResponse.json(
        { error: "Превышен лимит запросов" },
        { status: 429, headers: retryAfter ? { "Retry-After": retryAfter } : undefined }
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      logger.error("VERIFY-GROQ", reqId, (err as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`);
      return NextResponse.json(
        {
          error:
            (err as { error?: { message?: string } })?.error?.message ||
            `Ошибка ${res.status}`,
        },
        { status: res.status }
      );
    }

    logger.success("VERIFY-GROQ", reqId, "Ключ валиден");
    return NextResponse.json({ success: true });
  } catch (e) {
    logger.error("VERIFY-GROQ", reqId, e instanceof Error ? e.message : "Не удалось проверить");
    return NextResponse.json(
      { error: "Не удалось проверить ключ" },
      { status: 500 }
    );
  }
}
