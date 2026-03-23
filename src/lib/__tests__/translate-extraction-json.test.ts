import { describe, expect, it } from "vitest";
import {
  mergeTranslatedIntoResult,
  parseTranslatedExtractionJson,
  shouldOfferTranslateToRussian,
} from "@/lib/translate-extraction-json";
import type { ExtractionResult } from "@/types";

const baseResult = (): ExtractionResult => ({
  id: "x",
  title: "Hello",
  source: "https://a.com",
  sourceType: "url",
  createdAt: new Date().toISOString(),
  summary: "Summary",
  keyIdeas: ["a", "b"],
  flashcards: [{ question: "Q", answer: "A" }],
  structuredNotes: "Notes",
  tags: ["t1"],
  language: "en",
});

describe("shouldOfferTranslateToRussian", () => {
  it("true for en", () => {
    expect(shouldOfferTranslateToRussian("en")).toBe(true);
    expect(shouldOfferTranslateToRussian("en-US")).toBe(true);
    expect(shouldOfferTranslateToRussian("english")).toBe(true);
  });
  it("false for ru or empty", () => {
    expect(shouldOfferTranslateToRussian("ru")).toBe(false);
    expect(shouldOfferTranslateToRussian("")).toBe(false);
    expect(shouldOfferTranslateToRussian(undefined)).toBe(false);
  });
});

describe("parseTranslatedExtractionJson + merge", () => {
  it("applies translation and keeps code href", () => {
    const orig = baseResult();
    orig.codeSnippets = [{ title: "Fn", language: "ts", code: "const x=1", explanation: "Sets x" }];
    orig.extractedLinks = [{ href: "https://z.com", label: "Link", description: "Desc" }];

    const json = JSON.stringify({
      title: "Привет",
      summary: "Резюме",
      keyIdeas: ["а", "б"],
      flashcards: [{ question: "В", answer: "О" }],
      structuredNotes: "Заметки",
      tags: ["т1"],
      codeSnippets: [{ title: "Фн", explanation: "Ставит x" }],
      extractedLinks: [{ label: "Ссылка", description: "Описание" }],
    });

    const t = parseTranslatedExtractionJson(json);
    const merged = mergeTranslatedIntoResult(orig, t);
    expect(merged.language).toBe("ru");
    expect(merged.title).toBe("Привет");
    expect(merged.codeSnippets?.[0]?.code).toBe("const x=1");
    expect(merged.extractedLinks?.[0]?.href).toBe("https://z.com");
    expect(merged.extractedLinks?.[0]?.label).toBe("Ссылка");
  });
});
