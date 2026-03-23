import { NextRequest, NextResponse } from "next/server";
import type { ExtractionResult } from "@/types";
import { ValidationError } from "@/lib/errors";
import { handleApiError } from "@/lib/api-error-handler";
import { validateOllamaUrl } from "@/lib/validate";
import { callGroq, callGemini, callOllama } from "@/lib/ai-providers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openUserApiKey } from "@/lib/user-api-keys-crypto";

interface ExpandPayload {
  action: "expand";
  idea: string;
  context: { title: string; summary: string; keyIdeas?: string[]; structuredNotes?: string };
  provider: "groq" | "gemini" | "ollama";
  groqApiKey?: string;
  groqModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

interface ComparePayload {
  action: "compare";
  noteA: ExtractionResult;
  noteB: ExtractionResult;
  provider: "groq" | "gemini" | "ollama";
  groqApiKey?: string;
  groqModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

interface QuestionPayload {
  action: "question";
  question: string;
  context: ExtractionResult;
  history?: { role: "user" | "assistant"; content: string }[];
  provider: "groq" | "gemini" | "ollama";
  groqApiKey?: string;
  groqModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

type ActionPayload = ExpandPayload | ComparePayload | QuestionPayload;

function buildContextText(ctx: { title?: string; summary?: string; keyIdeas?: string[]; structuredNotes?: string }): string {
  const parts: string[] = [];
  if (ctx.title) parts.push(`Заголовок: ${ctx.title}`);
  if (ctx.summary) parts.push(`Резюме:\n${ctx.summary}`);
  if (ctx.keyIdeas?.length) parts.push(`Ключевые идеи:\n${ctx.keyIdeas.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`);
  if (ctx.structuredNotes) parts.push(`Заметки:\n${ctx.structuredNotes}`);
  return parts.join("\n\n---\n\n");
}

async function runAction(payload: ActionPayload): Promise<string> {
  const provider = payload.provider;
  const groqApiKey = payload.groqApiKey || process.env.GROQ_API_KEY || "";
  const groqModel = payload.groqModel || process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const geminiApiKey = payload.geminiApiKey || process.env.GEMINI_API_KEY || "";
  const geminiModel = payload.geminiModel || process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const ollamaUrl = validateOllamaUrl(payload.ollamaUrl || process.env.OLLAMA_URL || "http://localhost:11434");
  const ollamaModel = payload.ollamaModel || process.env.OLLAMA_MODEL || "llama3.1";

  let systemPrompt = "";
  let userContent = "";

  if (payload.action === "expand") {
    systemPrompt = `Ты — эксперт по объяснению идей. Дай развёрнутое, понятное объяснение идеи в контексте материала. Используй примеры, аналогии, структуру. Отвечай на том же языке, что и идея.`;
    const ctxText = buildContextText(payload.context);
    userContent = `Материал:\n\n${ctxText}\n\n---\n\nИдея для углубления:\n"${payload.idea}"\n\nДай развёрнутое объяснение этой идеи (2–4 абзаца).`;
  } else if (payload.action === "compare") {
    systemPrompt = `Ты — эксперт по анализу и сравнению. Сравни две заметки по теме: общие идеи, различия, взаимодополняющие аспекты. Структурируй ответ: общее, различия, выводы. Отвечай на том же языке, что и заметки.`;
    const ctxA = buildContextText(payload.noteA);
    const ctxB = buildContextText(payload.noteB);
    userContent = `Заметка A («${payload.noteA.title}»):\n\n${ctxA}\n\n---\n\nЗаметка B («${payload.noteB.title}»):\n\n${ctxB}\n\n---\n\nСравни эти две заметки.`;
  } else if (payload.action === "question") {
    systemPrompt = `Ты — помощник, отвечающий на вопросы по материалу. Отвечай только на основе предоставленного контента. Если ответа нет в материале — скажи об этом. Отвечай на том же языке, что и вопрос.`;
    const ctxText = buildContextText(payload.context);
    const history = payload.history ?? [];
    const messages: { role: "user" | "system" | "assistant"; content: string }[] = [
      { role: "system", content: `Материал для ответов:\n\n${ctxText}` },
      ...history.flatMap((h) => [{ role: h.role, content: h.content }] as const),
      { role: "user", content: payload.question },
    ];
    if (provider === "groq") {
      if (!groqApiKey) throw new ValidationError("API-ключ Groq не указан");
      return callGroq(groqApiKey, groqModel, messages);
    }
    if (provider === "gemini") {
      if (!geminiApiKey) throw new ValidationError("API-ключ Gemini не указан");
      return callGemini(geminiApiKey, geminiModel, messages);
    }
    return callOllama(ollamaUrl, ollamaModel, messages);
  }

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userContent },
  ];

  if (provider === "groq") {
    if (!groqApiKey) throw new ValidationError("API-ключ Groq не указан");
    return callGroq(groqApiKey, groqModel, messages);
  }
  if (provider === "gemini") {
    if (!geminiApiKey) throw new ValidationError("API-ключ Gemini не указан");
    return callGemini(geminiApiKey, geminiModel, messages);
  }
  return callOllama(ollamaUrl, ollamaModel, messages);
}

export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  try {
    const payload = (await request.json().catch(() => null)) as ActionPayload | null;
    if (!payload?.action || !["expand", "compare", "question"].includes(payload.action)) {
      throw new ValidationError("Неизвестное действие. Укажите action: expand, compare или question.");
    }
    const session = await auth();
    if (session?.user?.email) {
      const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { groqApiKey: true, geminiApiKey: true } });
      if (u) {
        const g = openUserApiKey(u.groqApiKey);
        const m = openUserApiKey(u.geminiApiKey);
        if (payload.provider === "groq" && !payload.groqApiKey && g) payload.groqApiKey = g;
        if (payload.provider === "gemini" && !payload.geminiApiKey && m) payload.geminiApiKey = m;
      }
    }
    const text = await runAction(payload);
    return NextResponse.json({ text });
  } catch (e) {
    return handleApiError(e, "AI-ACTION", reqId);
  }
}
