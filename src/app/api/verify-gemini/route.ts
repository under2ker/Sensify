import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/ai-providers";
import { getClientIp } from "@/lib/rate-limit";
import { checkDistributedRateLimit } from "@/lib/distributed-rate-limit";

const VERIFY_GEMINI_PER_MINUTE = 40;

/** POST — проверить API-ключ Gemini */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request) ?? "unknown";
  const rl = await checkDistributedRateLimit(
    ip,
    "verify-gemini",
    VERIFY_GEMINI_PER_MINUTE,
    60_000
  );
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: "Слишком много проверок с этого адреса. Подождите минуту." },
      {
        status: 429,
        headers: rl.retryAfterSec
          ? { "Retry-After": String(rl.retryAfterSec) }
          : undefined,
      }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Укажите API-ключ" }, { status: 400 });
    }

    await callGemini(apiKey, "gemini-2.0-flash", [
      { role: "user", content: "Ответь одним словом: OK" },
    ], { maxTokens: 10 });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка проверки";
    return NextResponse.json({ success: false, error: msg }, { status: 200 });
  }
}
