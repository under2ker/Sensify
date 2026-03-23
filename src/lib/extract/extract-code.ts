/**
 * Извлечение фрагментов кода из HTML и текста (Markdown-ограждения).
 * Кандидаты передаются в LLM для поля codeSnippets в ответе.
 */

export type CodeCandidate = { language?: string; code: string };

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)));
}

function stripTagsKeepNewlines(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
}

function parseLanguageFromClass(className: string): string | undefined {
  const c = className.toLowerCase();
  const m =
    c.match(/language-([\w+-]+)/) ||
    c.match(/lang-([\w+-]+)/) ||
    c.match(/brush:\s*([\w+-]+)/) ||
    c.match(/highlight-source-([\w+-]+)/);
  return m ? m[1] : undefined;
}

function parseLanguageFromAttrs(attrs: string): string | undefined {
  const cls = attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1] || "";
  return parseLanguageFromClass(cls);
}

const MIN_CODE_LEN = 18;
const MAX_BLOCKS = 24;
const MAX_BLOCK_CHARS = 4500;

/**
 * Блоки в тройных бэктиках (Markdown, README, issue).
 */
export function extractFencedCodeFromText(text: string, options?: { max?: number }): CodeCandidate[] {
  const max = options?.max ?? MAX_BLOCKS;
  const out: CodeCandidate[] = [];
  const re = /```([\w+-]*)\s*\n?([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null && out.length < max) {
    const lang = m[1]?.trim() || undefined;
    let code = m[2] ?? "";
    code = code.replace(/\r\n/g, "\n").trim();
    if (code.length < MIN_CODE_LEN) continue;
    out.push({
      language: lang && lang.length < 40 ? lang : undefined,
      code: code.length > MAX_BLOCK_CHARS ? code.slice(0, MAX_BLOCK_CHARS) : code,
    });
  }
  return out;
}

/**
 * <pre> и выделенные <code> с language-* в class.
 */
export function extractCodeBlocksFromHtml(html: string, options?: { max?: number }): CodeCandidate[] {
  const max = options?.max ?? MAX_BLOCKS;
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

  const out: CodeCandidate[] = [];

  const preRe = /<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi;
  let pm: RegExpExecArray | null;
  while ((pm = preRe.exec(clean)) !== null && out.length < max) {
    const preAttrs = pm[1];
    let inner = pm[2];
    const codeInner = inner.match(/<code\b([^>]*)>([\s\S]*?)<\/code>/i);
    let lang = parseLanguageFromAttrs(preAttrs);
    if (codeInner) {
      if (!lang) lang = parseLanguageFromAttrs(codeInner[1]);
      inner = codeInner[2];
    }
    const code = decodeBasicEntities(stripTagsKeepNewlines(inner)).replace(/\r\n/g, "\n").trim();
    if (code.length < MIN_CODE_LEN) continue;
    out.push({
      language: lang,
      code: code.length > MAX_BLOCK_CHARS ? code.slice(0, MAX_BLOCK_CHARS) : code,
    });
  }

  // Отдельные <code class="language-..."> без <pre> (иногда в доках)
  const codeRe = /<code\b([^>]*)>([\s\S]*?)<\/code>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = codeRe.exec(clean)) !== null && out.length < max) {
    const lang = parseLanguageFromAttrs(cm[1]);
    if (!lang) continue;
    const code = decodeBasicEntities(stripTagsKeepNewlines(cm[2])).replace(/\r\n/g, "\n").trim();
    if (code.length < MIN_CODE_LEN) continue;
    out.push({
      language: lang,
      code: code.length > MAX_BLOCK_CHARS ? code.slice(0, MAX_BLOCK_CHARS) : code,
    });
  }

  return out;
}

function fingerprint(code: string): string {
  return code.replace(/\s+/g, " ").trim().slice(0, 280);
}

/**
 * Объединяет кандидаты из HTML и текста, убирает дубликаты.
 */
export function mergeCodeCandidates(a: CodeCandidate[], b: CodeCandidate[]): CodeCandidate[] {
  const seen = new Set<string>();
  const out: CodeCandidate[] = [];
  for (const block of [...a, ...b]) {
    const fp = fingerprint(block.code);
    if (fp.length < MIN_CODE_LEN) continue;
    if (seen.has(fp)) continue;
    seen.add(fp);
    const code =
      block.code.length > MAX_BLOCK_CHARS
        ? `${block.code.slice(0, MAX_BLOCK_CHARS)}\n// … (обрезано)`
        : block.code;
    out.push({ language: block.language, code });
    if (out.length >= MAX_BLOCKS) break;
  }
  return out;
}

/**
 * Добавка к user-сообщению для модели.
 */
export function formatCodeCandidatesForPrompt(blocks: CodeCandidate[]): string {
  if (!blocks.length) return "";
  const lines: string[] = [
    "",
    "---",
    "Ниже — фрагменты кода, автоматически извлечённые из источника (страница, Markdown, README и т.д.).",
    "В итоговом JSON заполни поле codeSnippets: для каждого значимого фрагмента — объект с полями title, language (если известен), code (можно чуть сократить с // …), explanation.",
    "В explanation на языке ответа опиши: что делает код, как он работает, зачем нужен и почему реализован так.",
    "Если кода по сути нет — верни codeSnippets: [].",
    "",
  ];
  const cap = 16;
  blocks.slice(0, cap).forEach((b, i) => {
    const fenceLang = (b.language || "").replace(/[^a-z0-9+-]/gi, "") || "text";
    lines.push(`### Кандидат ${i + 1}${b.language ? ` (${b.language})` : ""}`);
    lines.push("```" + fenceLang);
    lines.push(b.code.length > 3800 ? `${b.code.slice(0, 3800)}\n// …` : b.code);
    lines.push("```");
    lines.push("");
  });
  return lines.join("\n");
}
