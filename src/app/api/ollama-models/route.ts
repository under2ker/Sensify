import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { validateOllamaUrl } from "@/lib/validate";
import { ValidationError } from "@/lib/errors";

interface OllamaModel {
  name: string;
  model?: string;
  modified_at?: string;
  size?: number;
  details?: { parameter_size?: string; family?: string };
}

export async function GET(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  logger.api("OLLAMA-MODELS", reqId, "Запрос списка моделей");

  try {
    const url = validateOllamaUrl(
      request.nextUrl.searchParams.get("url") || process.env.OLLAMA_URL || "http://localhost:11434"
    );
    const base = url.replace(/\/$/, "");

    const res = await fetch(`${base}/api/tags`, { method: "GET" });

    if (!res.ok) {
      logger.error("OLLAMA-MODELS", reqId, `HTTP ${res.status}`);
      return NextResponse.json(
        { error: "Ollama недоступна" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { models?: OllamaModel[] };
    const models = (data.models ?? []).map((m) => ({
      value: m.name ?? m.model ?? "",
      label: m.name ?? m.model ?? "",
      size: m.size,
      parameterSize: m.details?.parameter_size,
    }));

    logger.success("OLLAMA-MODELS", reqId, `Найдено ${models.length} моделей`);
    return NextResponse.json({ models });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    logger.error("OLLAMA-MODELS", reqId, e instanceof Error ? e.message : "Ошибка");
    return NextResponse.json(
      { error: "Не удалось получить список моделей" },
      { status: 500 }
    );
  }
}
