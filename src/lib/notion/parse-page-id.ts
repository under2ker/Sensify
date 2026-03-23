import { ValidationError } from "@/lib/errors";

/** Извлекает UUID страницы Notion из ссылки или строки с/без дефисов. */
export function parseNotionPageId(raw: string): string {
  const t = raw.trim();
  const m = t.match(/([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})/i);
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}`.toLowerCase();
  }
  const compact = t.replace(/-/g, "");
  if (/^[0-9a-f]{32}$/i.test(compact)) {
    return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20, 32)}`.toLowerCase();
  }
  throw new ValidationError(
    "Некорректный ID страницы Notion. Вставьте ссылку на страницу или UUID (32 символа)."
  );
}
