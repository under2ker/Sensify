import type { ExtractionResult } from "@/types";

const MAX_TEXT = 1990;

/** Notion rich_text сегменты с лимитом длины. */
function richParts(text: string): { type: "text"; text: { content: string } }[] {
  const t = text.replace(/\r\n/g, "\n");
  const parts: { type: "text"; text: { content: string } }[] = [];
  for (let i = 0; i < t.length; i += MAX_TEXT) {
    parts.push({ type: "text", text: { content: t.slice(i, i + MAX_TEXT) } });
  }
  return parts.length ? parts : [{ type: "text", text: { content: " " } }];
}

type NotionBlock = Record<string, unknown>;

function paragraph(text: string): NotionBlock | null {
  const s = text.trim();
  if (!s) return null;
  return {
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: richParts(s) },
  };
}

function heading(level: 1 | 2 | 3, text: string): NotionBlock {
  const key = `heading_${level}` as const;
  const s = text.trim().slice(0, MAX_TEXT) || " ";
  return {
    object: "block",
    type: key,
    [key]: { rich_text: richParts(s) },
  };
}

function bullet(text: string): NotionBlock | null {
  const s = text.trim();
  if (!s) return null;
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: richParts(s) },
  };
}

function codeBlock(code: string, language: string): NotionBlock {
  const lang = (language || "plain text").toLowerCase().slice(0, 48) || "plain text";
  return {
    object: "block",
    type: "code",
    code: {
      rich_text: richParts(code || " "),
      language: lang,
    },
  };
}

function divider(): NotionBlock {
  return { object: "block", type: "divider", divider: {} };
}

/** Блоки для страницы из результата извлечения. */
export function buildNotionBlocksFromResult(
  result: ExtractionResult,
  extraTags: string[]
): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  const tags = [...(result.tags ?? []), ...extraTags];

  blocks.push(heading(2, "Резюме"));
  const sum = (result.summary ?? "").trim();
  if (sum) {
    for (const para of sum.split(/\n\n+/)) {
      const p = paragraph(para);
      if (p) blocks.push(p);
    }
  } else {
    blocks.push(paragraph("—")!);
  }

  blocks.push(divider());
  blocks.push(heading(2, "Ключевые идеи"));
  const ideas = result.keyIdeas ?? [];
  if (ideas.length) {
    for (const idea of ideas) {
      const b = bullet(idea);
      if (b) blocks.push(b);
    }
  } else {
    blocks.push(paragraph("—")!);
  }

  blocks.push(divider());
  blocks.push(heading(2, "Карточки"));
  const cards = result.flashcards ?? [];
  if (cards.length) {
    cards.forEach((fc, i) => {
      blocks.push(heading(3, `Карточка ${i + 1}`));
      const q = paragraph(`В: ${fc.question}`);
      const a = paragraph(`О: ${fc.answer}`);
      if (q) blocks.push(q);
      if (a) blocks.push(a);
    });
  } else {
    blocks.push(paragraph("—")!);
  }

  blocks.push(divider());
  blocks.push(heading(2, "Структурированные заметки"));
  const notes = (result.structuredNotes ?? "").trim();
  if (notes) {
    for (const para of notes.split(/\n\n+/)) {
      const p = paragraph(para);
      if (p) blocks.push(p);
    }
  } else {
    blocks.push(paragraph("—")!);
  }

  const links = result.extractedLinks ?? [];
  if (links.length) {
    blocks.push(divider());
    blocks.push(heading(2, "Ссылки"));
    for (const l of links) {
      const line = `${l.label?.trim() || l.href}\n${l.href}${l.description?.trim() ? `\n${l.description.trim()}` : ""}`;
      const p = paragraph(line);
      if (p) blocks.push(p);
    }
  }

  const snippets = result.codeSnippets ?? [];
  if (snippets.length) {
    blocks.push(divider());
    blocks.push(heading(2, "Код"));
    for (const s of snippets) {
      blocks.push(heading(3, s.title + (s.language ? ` (${s.language})` : "")));
      blocks.push(codeBlock(s.code ?? "", s.language ?? ""));
      const exp = (s.explanation ?? "").trim();
      if (exp) {
        const p = paragraph(exp);
        if (p) blocks.push(p);
      }
    }
  }

  blocks.push(divider());
  blocks.push(heading(2, "Метаданные"));
  const metaLines = [
    `Источник: ${result.source}`,
    `Тип: ${result.sourceType}`,
    `Дата: ${result.createdAt}`,
    tags.length ? `Теги: ${tags.join(", ")}` : null,
    `Язык: ${result.language ?? "—"}`,
  ].filter(Boolean) as string[];
  for (const line of metaLines) {
    const p = paragraph(line);
    if (p) blocks.push(p);
  }

  return blocks;
}

/** Блоки для сохранённой страницы (Markdown-текст). */
export function buildNotionBlocksFromSavedPage(page: {
  title: string;
  content: string;
  source: string;
}): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  blocks.push(heading(2, "Содержимое"));
  const body = page.content.trim();
  if (body) {
    for (const para of body.split(/\n\n+/)) {
      const p = paragraph(para);
      if (p) blocks.push(p);
    }
  } else {
    blocks.push(paragraph("—")!);
  }
  blocks.push(divider());
  blocks.push(heading(2, "Источник"));
  blocks.push(paragraph(`Страница: ${page.source}`) || paragraph("—")!);
  return blocks;
}
