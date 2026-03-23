/**
 * Парсинг JSON-ответа от AI-модели.
 */

/** Удаляет control characters (\x00-\x1F) из строк, ломающие JSON.parse */
export function sanitizeJsonString(str: string): string {
  return str.replace(/[\x00-\x1f\x7f]/g, (ch) => {
    if (ch === "\t") return "\t";
    if (ch === "\n") return "\n";
    if (ch === "\r") return "\r";
    return " ";
  });
}

export function parseJsonResponse(text: string): Record<string, unknown> {
  let cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  cleaned = sanitizeJsonString(cleaned);

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(sanitizeJsonString(jsonMatch[0]));
      } catch {
        const fixed = jsonMatch[0]
          .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_, inner) => {
            return '"' + inner.replace(/[\x00-\x1f\x7f]/g, " ").replace(/\\/g, "\\\\") + '"';
          })
          .replace(/\\\\/g, "\\");
        try {
          return JSON.parse(fixed);
        } catch {
          // ignore
        }
      }
    }
    throw new Error(
      "Модель вернула невалидный JSON. Попробуйте ещё раз или смените модель."
    );
  }
}
