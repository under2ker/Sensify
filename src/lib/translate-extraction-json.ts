import { z } from "zod";
import type { ExtractionResult, FlashCard } from "@/types";

/** Когда модель пометила материал как английский — показываем кнопку перевода на русский */
export function shouldOfferTranslateToRussian(resultLanguage: string | undefined): boolean {
  const l = (resultLanguage || "").trim().toLowerCase();
  if (!l || l.startsWith("ru")) return false;
  return l === "en" || l.startsWith("en-") || l === "english";
}

const translatedShape = z.object({
  title: z.string(),
  summary: z.string(),
  keyIdeas: z.array(z.string()),
  flashcards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
  structuredNotes: z.string(),
  tags: z.array(z.string()),
  codeSnippets: z.array(
    z.object({
      title: z.string(),
      explanation: z.string(),
    })
  ),
  extractedLinks: z.array(
    z.object({
      label: z.string(),
      description: z.string().optional(),
    })
  ),
});

export type TranslatedExtractionPayload = z.infer<typeof translatedShape>;

export function buildTranslatePayload(result: ExtractionResult): TranslatedExtractionPayload {
  return {
    title: result.title ?? "",
    summary: result.summary ?? "",
    keyIdeas: [...(result.keyIdeas ?? [])],
    flashcards: (result.flashcards ?? []).map((fc) => ({
      question: fc.question ?? "",
      answer: fc.answer ?? "",
    })),
    structuredNotes: result.structuredNotes ?? "",
    tags: [...(result.tags ?? [])],
    codeSnippets: (result.codeSnippets ?? []).map((s) => ({
      title: s.title ?? "",
      explanation: s.explanation ?? "",
    })),
    extractedLinks: (result.extractedLinks ?? []).map((l) => ({
      label: l.label ?? "",
      description: l.description,
    })),
  };
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  const body = fence ? fence[1]!.trim() : trimmed;
  return JSON.parse(body) as unknown;
}

export function parseTranslatedExtractionJson(raw: string): TranslatedExtractionPayload {
  const data = extractJsonObject(raw);
  const parsed = translatedShape.safeParse(data);
  if (!parsed.success) {
    throw new Error("Модель вернула неверный формат перевода");
  }
  return parsed.data;
}

/** Склеиваем переведённые поля с оригиналом (код и href не трогаем). */
export function mergeTranslatedIntoResult(
  original: ExtractionResult,
  t: TranslatedExtractionPayload
): Partial<ExtractionResult> {
  const origCards = original.flashcards ?? [];
  const flashcards: FlashCard[] = origCards.map((fc, i) => ({
    question: t.flashcards[i]?.question ?? fc.question,
    answer: t.flashcards[i]?.answer ?? fc.answer,
  }));

  const origCode = original.codeSnippets ?? [];
  const codeSnippets = origCode.map((s, i) => ({
    ...s,
    title: t.codeSnippets[i]?.title ?? s.title,
    explanation: t.codeSnippets[i]?.explanation ?? s.explanation,
  }));

  const origLinks = original.extractedLinks ?? [];
  const extractedLinks = origLinks.map((l, i) => ({
    ...l,
    label: t.extractedLinks[i]?.label ?? l.label,
    description: t.extractedLinks[i]?.description ?? l.description,
  }));

  const origIdeas = original.keyIdeas ?? [];
  const keyIdeas =
    t.keyIdeas.length === origIdeas.length
      ? t.keyIdeas
      : origIdeas.map((k, i) => t.keyIdeas[i] ?? k);

  const origTags = original.tags ?? [];
  const tags =
    t.tags.length === origTags.length ? t.tags : origTags.map((tag, i) => t.tags[i] ?? tag);

  return {
    language: "ru",
    title: t.title,
    summary: t.summary,
    keyIdeas,
    flashcards,
    structuredNotes: t.structuredNotes,
    tags,
    codeSnippets,
    extractedLinks,
  };
}
