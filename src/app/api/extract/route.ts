import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error-handler";
import { assertUrlSafeForFetch, validateOllamaUrl } from "@/lib/validate";
import { callGroq, callGemini, callOllama, streamGroq, streamGemini, streamOllama } from "@/lib/ai-providers";
import { ValidationError } from "@/lib/errors";
import {
  buildSystemPrompt,
  qualityTokens,
} from "@/lib/extract/prompts";
import {
  fetchUrlContent,
  fetchGithubContent,
  fetchRedditContent,
  fetchTelegramContent,
  fetchNotionContent,
  fetchRssContent,
  fetchYouTubeTranscript,
} from "@/lib/extract/fetchers";
import { parseJsonResponse } from "@/lib/extract/parse-result";
import { getClientIp } from "@/lib/rate-limit";
import { checkDistributedRateLimit } from "@/lib/distributed-rate-limit";
import { openUserApiKey } from "@/lib/user-api-keys-crypto";
import {
  extractFencedCodeFromText,
  formatCodeCandidatesForPrompt,
  mergeCodeCandidates,
  type CodeCandidate,
} from "@/lib/extract/extract-code";
import type { ExtractedLink } from "@/types";

type SourceTypePayload =
  | "url"
  | "pdf"
  | "youtube"
  | "text"
  | "telegram"
  | "notion"
  | "rss"
  | "github"
  | "reddit";

interface ExtractionRequest {
  content: string;
  sourceType: SourceTypePayload | "substack";
  source: string;
  quality: "fast" | "balanced" | "deep";
  language: string;
  provider: "groq" | "gemini" | "ollama";
  groqApiKey?: string;
  groqModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  customPrompt?: string;
  extractionPreset?: string;
  stream?: boolean;
}

const FREE_DAILY_EXTRACTIONS = 10;
const ANONYMOUS_DAILY_EXTRACTIONS = 3;
/** Защита от всплесков: поверх дневных лимитов (in-memory, один инстанс). */
const EXTRACT_BURST_PER_MIN_AUTH = 48;
const EXTRACT_BURST_PER_MIN_ANON = 14;

/** Следующая полночь UTC — момент сброса дневного лимита (как в запросах к БД). */
function nextUtcMidnightIso(): string {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0)
  ).toISOString();
}

function getAnonymousIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "anon-unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return request.headers.get("x-vercel-forwarded-for") ?? "anon-unknown";
}

export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  logger.api("EXTRACT", reqId, "Запрос получен");

  try {
    const body: ExtractionRequest = await request.json();
    const sourceType: SourceTypePayload =
      body.sourceType === "substack" ? "url" : body.sourceType;
    const { source, quality, language, provider } = body;

    const session = await auth();
    const ip = getClientIp(request) ?? "unknown";
    const burstLimit = session?.user?.email
      ? EXTRACT_BURST_PER_MIN_AUTH
      : EXTRACT_BURST_PER_MIN_ANON;
    const burstRl = await checkDistributedRateLimit(
      ip,
      "extract-post",
      burstLimit,
      60_000
    );
    if (!burstRl.ok) {
      return NextResponse.json(
        {
          error:
            "Слишком много запросов извлечения с этого адреса. Подождите минуту.",
          retryKind: "burst" as const,
        },
        {
          status: 429,
          headers: burstRl.retryAfterSec
            ? { "Retry-After": String(burstRl.retryAfterSec) }
            : undefined,
        }
      );
    }

    const anonId = !session?.user?.email ? getAnonymousIdentifier(request) : null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { subscription: true },
      });
      if (user) {
        const hasPremium = user.subscription?.premiumUntil && new Date(user.subscription.premiumUntil) > new Date();
        if (!hasPremium) {
          const today = new Date().toISOString().slice(0, 10);
          const todayCount = await prisma.extraction.count({
            where: {
              userId: user.id,
              createdAt: { gte: new Date(`${today}T00:00:00.000Z`), lt: new Date(new Date(today).getTime() + 86400000) },
            },
          });
          if (todayCount >= FREE_DAILY_EXTRACTIONS) {
            return NextResponse.json(
              {
                error: `Лимит бесплатных извлечений на сегодня исчерпан (${FREE_DAILY_EXTRACTIONS}/день). Оформите премиум для снятия ограничений.`,
                resetsAt: nextUtcMidnightIso(),
                limitKind: "free_daily" as const,
              },
              { status: 402 }
            );
          }
        }
      }
    } else if (anonId) {
      const today = new Date().toISOString().slice(0, 10);
      const anonTodayCount = await prisma.anonymousExtraction.count({
        where: {
          identifier: anonId,
          createdAt: {
            gte: new Date(`${today}T00:00:00.000Z`),
            lt: new Date(new Date(today).getTime() + 86400000),
          },
        },
      });
      if (anonTodayCount >= ANONYMOUS_DAILY_EXTRACTIONS) {
        return NextResponse.json(
          {
            error: `Лимит для гостей исчерпан (${ANONYMOUS_DAILY_EXTRACTIONS}/день). Зарегистрируйтесь для 10 извлечений в день.`,
            resetsAt: nextUtcMidnightIso(),
            limitKind: "guest" as const,
          },
          { status: 402 }
        );
      }
    }

    // SSRF: валидируем URL перед fetch для всех типов, где source — ссылка
    const urlSourceTypes = ["url", "github", "reddit", "youtube", "telegram", "notion", "rss"];
    if (source && urlSourceTypes.includes(sourceType)) {
      try {
        assertUrlSafeForFetch(source, "source");
      } catch {
        return NextResponse.json(
          { error: "Недопустимая ссылка. Используйте только публичные внешние URL." },
          { status: 400 }
        );
      }
    }

    logger.api("EXTRACT", reqId, `Источник: ${sourceType} | Качество: ${quality} | Провайдер: ${provider}`);
    let { content } = body;
    let imageUrl: string | null = null;
    let extractedLinks: ExtractedLink[] = [];
    let htmlCodeCandidates: CodeCandidate[] = [];

    const isYouTube =
      sourceType === "youtube" ||
      (sourceType === "url" && source && /(?:youtube\.com|youtu\.be)/.test(source));

    if (isYouTube && source) {
      content = await fetchYouTubeTranscript(source);
      extractedLinks = [];
      htmlCodeCandidates = [];
    } else if (sourceType === "telegram" && source) {
      const t = await fetchTelegramContent(source);
      content = t.text;
      imageUrl = t.imageUrl;
      extractedLinks = t.links;
      htmlCodeCandidates = t.codeCandidates;
    } else if (sourceType === "notion" && source) {
      const n = await fetchNotionContent(source);
      content = n.text;
      imageUrl = n.imageUrl;
      extractedLinks = n.links;
      htmlCodeCandidates = n.codeCandidates;
    } else if (sourceType === "rss" && source) {
      content = await fetchRssContent(source);
      extractedLinks = [];
      htmlCodeCandidates = [];
    } else if (sourceType === "github" && source) {
      const fetched = await fetchGithubContent(source);
      content = fetched.text;
      imageUrl = fetched.imageUrl;
      extractedLinks = fetched.links;
      htmlCodeCandidates = fetched.codeCandidates;
    } else if (sourceType === "reddit" && source) {
      const fetched = await fetchRedditContent(source);
      content = fetched.text;
      imageUrl = fetched.imageUrl;
      extractedLinks = fetched.links;
      htmlCodeCandidates = fetched.codeCandidates;
    } else if (sourceType === "url" && source) {
      const fetched = await fetchUrlContent(source);
      content = fetched.text;
      imageUrl = fetched.imageUrl;
      extractedLinks = fetched.links;
      htmlCodeCandidates = fetched.codeCandidates;
    }

    if (!content || content.trim().length < 30) {
      return NextResponse.json(
        { error: "Недостаточно контента для извлечения знаний." },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(
      quality,
      language,
      body.extractionPreset,
      body.customPrompt
    );
    const mergedCodeForPrompt = mergeCodeCandidates(htmlCodeCandidates, extractFencedCodeFromText(content));
    const userContent = `Извлеки знания из этого контента:\n\n${content}${formatCodeCandidatesForPrompt(mergedCodeForPrompt)}`;
    const maxTokens = qualityTokens[quality] || 3000;

    if (body.stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (obj: object) =>
            controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
          try {
            let gen: AsyncGenerator<string, string, unknown>;
            if (provider === "ollama") {
              let ollamaUrl: string;
              try {
                ollamaUrl = validateOllamaUrl(body.ollamaUrl || process.env.OLLAMA_URL || "http://localhost:11434");
              } catch (e) {
                send({ t: "error", e: e instanceof ValidationError ? e.message : "Недопустимый URL Ollama" });
                controller.close();
                return;
              }
              const ollamaModel = body.ollamaModel || process.env.OLLAMA_MODEL || "llama3.1";
              const messages = [
                { role: "system" as const, content: systemPrompt },
                { role: "user" as const, content: userContent },
              ];
              gen = streamOllama(ollamaUrl, ollamaModel, messages, { maxTokens });
            } else if (provider === "gemini") {
              let geminiApiKey = body.geminiApiKey || process.env.GEMINI_API_KEY || "";
              if (!geminiApiKey && session?.user?.email) {
                const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { geminiApiKey: true } });
                geminiApiKey = openUserApiKey(u?.geminiApiKey) ?? "";
              }
              const geminiModel = body.geminiModel || process.env.GEMINI_MODEL || "gemini-2.0-flash";
              if (!geminiApiKey) {
                send({ t: "error", e: "API-ключ Gemini не указан." });
                controller.close();
                return;
              }
              const messages = [
                { role: "system" as const, content: systemPrompt },
                { role: "user" as const, content: userContent },
              ];
              gen = streamGemini(geminiApiKey, geminiModel, messages, { maxTokens });
            } else {
              let groqApiKey = body.groqApiKey || process.env.GROQ_API_KEY || "";
              if (!groqApiKey && session?.user?.email) {
                const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { groqApiKey: true } });
                groqApiKey = openUserApiKey(u?.groqApiKey) ?? "";
              }
              const groqModel = body.groqModel || process.env.GROQ_MODEL || "llama-3.1-8b-instant";
              if (!groqApiKey) {
                send({ t: "error", e: "API-ключ Groq не указан." });
                controller.close();
                return;
              }
              const messages = [
                { role: "system" as const, content: systemPrompt },
                { role: "user" as const, content: userContent },
              ];
              gen = streamGroq(groqApiKey, groqModel, messages, { maxTokens });
            }
            let fullContent = "";
            for await (const chunk of gen) {
              fullContent += chunk;
              send({ t: "chunk", c: chunk });
            }
            if (!fullContent) {
              send({ t: "error", e: "Пустой ответ от модели" });
              controller.close();
              return;
            }
            const result = parseJsonResponse(fullContent);
            logger.success("EXTRACT", reqId, `Готово (stream): "${(result.title as string)?.slice(0, 50)}..."`);
            if (session?.user?.email) {
              const user = await prisma.user.findUnique({ where: { email: session.user.email } });
              if (user) {
                await prisma.extraction.create({
                  data: { userId: user.id, source, sourceType, title: (result.title as string) || null },
                }).catch((e) => logger.error("EXTRACT", reqId, (e as Error).message));
              }
            } else if (anonId) {
              await prisma.anonymousExtraction.create({
                data: { identifier: anonId },
              }).catch((e) => logger.error("EXTRACT", reqId, (e as Error).message));
            }
            send({
              t: "result",
              r: result,
              source,
              sourceType,
              imageUrl: imageUrl || undefined,
              extractedLinks,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Ошибка";
            send({ t: "error", e: msg });
          } finally {
            controller.close();
          }
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "application/x-ndjson",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    let responseText: string;

    if (provider === "ollama") {
      let ollamaUrl: string;
      try {
        ollamaUrl = validateOllamaUrl(body.ollamaUrl || process.env.OLLAMA_URL || "http://localhost:11434");
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof ValidationError ? e.message : "Недопустимый URL Ollama" },
          { status: 400 }
        );
      }
      const ollamaModel =
        body.ollamaModel || process.env.OLLAMA_MODEL || "llama3.1";

      try {
        const messages = [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: userContent },
        ];
        responseText = await callOllama(ollamaUrl, ollamaModel, messages, { maxTokens });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
          return NextResponse.json(
            {
              error:
                "Не удалось подключиться к Ollama. Убедитесь, что Ollama запущена (ollama serve), или переключитесь на Groq в настройках.",
            },
            { status: 502 }
          );
        }
        throw err;
      }
    } else if (provider === "gemini") {
      let geminiApiKey = body.geminiApiKey || process.env.GEMINI_API_KEY || "";
      if (!geminiApiKey && session?.user?.email) {
        const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { geminiApiKey: true } });
        geminiApiKey = openUserApiKey(u?.geminiApiKey) ?? "";
      }
      const geminiModel = body.geminiModel || process.env.GEMINI_MODEL || "gemini-2.0-flash";
      if (!geminiApiKey) {
        return NextResponse.json(
          { error: "API-ключ Gemini не указан. Получите ключ на aistudio.google.com/apikey и введите в Настройках." },
          { status: 400 }
        );
      }
      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userContent },
      ];
      responseText = await callGemini(geminiApiKey, geminiModel, messages, { maxTokens });
    } else {
      let groqApiKey = body.groqApiKey || process.env.GROQ_API_KEY || "";
      if (!groqApiKey && session?.user?.email) {
        const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { groqApiKey: true } });
        groqApiKey = openUserApiKey(u?.groqApiKey) ?? "";
      }
      const groqModel =
        body.groqModel || process.env.GROQ_MODEL || "llama-3.1-8b-instant";

      if (!groqApiKey) {
        return NextResponse.json(
          {
            error:
              "API-ключ Groq не указан. Получите бесплатный ключ на console.groq.com и введите его в Настройках.",
          },
          { status: 400 }
        );
      }

      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userContent },
      ];
      responseText = await callGroq(groqApiKey, groqModel, messages, { maxTokens });
    }

    if (!responseText) {
      return NextResponse.json(
        { error: "Пустой ответ от модели" },
        { status: 500 }
      );
    }

    const result = parseJsonResponse(responseText);

    logger.success("EXTRACT", reqId, `Готово: "${(result.title as string)?.slice(0, 50)}..."`);

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        await prisma.extraction.create({
          data: {
            userId: user.id,
            source,
            sourceType,
            title: (result.title as string) || null,
          },
        }).catch((e) => logger.error("EXTRACT", reqId, "Не удалось сохранить extraction: " + (e as Error).message));
      }
    } else if (anonId) {
      await prisma.anonymousExtraction.create({
        data: { identifier: anonId },
      }).catch((e) => logger.error("EXTRACT", reqId, (e as Error).message));
    }

    return NextResponse.json({
      ...result,
      source,
      sourceType,
      ...(imageUrl && { imageUrl }),
      extractedLinks,
    });
  } catch (e) {
    return handleApiError(e, "EXTRACT", reqId);
  }
}
