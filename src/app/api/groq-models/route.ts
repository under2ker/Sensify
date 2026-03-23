import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface GroqModel {
  id: string;
  created?: number;
  object?: string;
  owned_by?: string;
}

const KNOWN_LABELS: Record<string, string> = {
  "llama-3.1-8b-instant": "Llama 3.1 8B",
  "llama-3.3-70b-versatile": "Llama 3.3 70B",
  "llama-3.1-70b-versatile": "Llama 3.1 70B",
  "gemma2-9b-it": "Gemma 2 9B",
  "mixtral-8x7b-32768": "Mixtral 8x7B",
};

export async function GET(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  logger.api("GROQ-MODELS", reqId, "Запрос списка моделей");

  try {
    const apiKey = request.nextUrl.searchParams.get("apiKey") || process.env.GROQ_API_KEY;
    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "API-ключ не указан" }, { status: 400 });
    }

    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.status === 401) {
      logger.error("GROQ-MODELS", reqId, "Неверный API-ключ");
      return NextResponse.json({ error: "Неверный API-ключ" }, { status: 401 });
    }

    if (!res.ok) {
      logger.error("GROQ-MODELS", reqId, `HTTP ${res.status}`);
      const retryAfter = res.status === 429 ? res.headers.get("retry-after") : null;
      return NextResponse.json(
        { error: `Ошибка ${res.status}` },
        { status: res.status, headers: retryAfter ? { "Retry-After": retryAfter } : undefined },
      );
    }

    const data = (await res.json()) as { data?: GroqModel[] };
    const raw = data.data ?? [];
    const models = raw
      .filter((m) => m.id && !m.id.startsWith("whisper"))
      .map((m) => ({
        value: m.id,
        label: KNOWN_LABELS[m.id] ?? m.id,
      }));

    logger.success("GROQ-MODELS", reqId, `Найдено ${models.length} моделей`);
    return NextResponse.json({ models });
  } catch (e) {
    logger.error("GROQ-MODELS", reqId, e instanceof Error ? e.message : "Ошибка");
    return NextResponse.json(
      { error: "Не удалось получить список моделей" },
      { status: 500 }
    );
  }
}
