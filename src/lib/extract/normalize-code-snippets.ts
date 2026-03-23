import type { CodeSnippet } from "@/types";

/** Нормализация codeSnippets из ответа модели */
export function normalizeCodeSnippets(raw: unknown): CodeSnippet[] {
  if (!Array.isArray(raw)) return [];
  const out: CodeSnippet[] = [];
  for (const item of raw) {
    if (item === null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const code = String(o.code ?? "").trim();
    const explanation = String(o.explanation ?? "").trim();
    const titleRaw = String(o.title ?? "").trim();
    const title = titleRaw.slice(0, 220) || "Фрагмент кода";
    const lang = o.language != null ? String(o.language).trim().slice(0, 40) : "";
    if (!code && !explanation) continue;
    out.push({
      title,
      ...(lang ? { language: lang } : {}),
      code: code.slice(0, 120_000),
      explanation: explanation.slice(0, 20_000),
    });
  }
  return out.slice(0, 24);
}
