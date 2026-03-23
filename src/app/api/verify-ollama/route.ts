import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { validateOllamaUrl } from "@/lib/validate";
import { ValidationError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  logger.api("VERIFY-OLLAMA", reqId, "Проверка подключения");

  try {
    const body = await request.json().catch(() => ({}));
    const url = validateOllamaUrl(
      (body.ollamaUrl || process.env.OLLAMA_URL || "http://localhost:11434").toString()
    );
    const base = url.replace(/\/$/, "");

    const res = await fetch(`${base}/api/version`, { method: "GET" });

    if (!res.ok) {
      logger.error("VERIFY-OLLAMA", reqId, `HTTP ${res.status}`);
      return NextResponse.json(
        { error: `Ollama недоступна: ${res.status}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { version?: string };
    const version = data?.version ?? "unknown";
    logger.success("VERIFY-OLLAMA", reqId, `Ollama ${version}`);

    return NextResponse.json({
      success: true,
      version: data?.version ?? "unknown",
    });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    logger.error("VERIFY-OLLAMA", reqId, e instanceof Error ? e.message : "Ошибка");
    return NextResponse.json(
      { error: "Ollama недоступна. Убедитесь, что Ollama запущена." },
      { status: 500 }
    );
  }
}
