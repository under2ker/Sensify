import type { ExtractionResult, ExportFormat } from "@/types";
import { APP_NAME, APP_VERSION } from "@/lib/app-config";

export function generateExport(
  result: ExtractionResult,
  format: ExportFormat,
  tags: string[],
  filename: string
): string {
  switch (format) {
    case "obsidian":
      return generateObsidian(result, tags);
    case "notion":
      return generateNotionJson(result, tags);
    case "markdown":
      return generateMarkdown(result);
    case "clipboard":
      return generateMarkdown(result);
    case "readable":
      return generateReadable(result);
    case "pdf":
      return generateMarkdown(result);
  }
}

/** Экспорт сохранённой страницы (полная статья в Markdown) */
export function generateExportForSavedPage(
  savedPage: { title: string; content: string; source: string },
  format: ExportFormat,
  tags: string[],
  _filename: string
): string {
  switch (format) {
    case "obsidian": {
      const frontmatter = [
        "---",
        `title: "${savedPage.title}"`,
        `source: "${savedPage.source}"`,
        `type: url`,
        `date: ${new Date().toISOString().split("T")[0]}`,
        `tags: [${tags.map((t) => `"${t}"`).join(", ")}]`,
        "---",
        "",
      ].join("\n");
      return frontmatter + savedPage.content;
    }
    case "notion": {
      return JSON.stringify(
        {
          title: savedPage.title,
          source: savedPage.source,
          content: savedPage.content,
          tags,
        },
        null,
        2
      );
    }
    case "markdown":
    case "clipboard":
      return savedPage.content;
    case "pdf":
      return savedPage.content;
    case "readable": {
      const text = savedPage.content
        .replace(/^#{1,6}\s+/gm, (m) => "\n\n" + "  ".repeat((m.match(/#/g)?.length ?? 1) - 1) + "◆ ")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/^[-*]\s+/gm, "  • ")
        .replace(/^\d+\.\s+/gm, "    ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      return `${savedPage.title}\n\nИсточник: ${savedPage.source}\n\n${"─".repeat(60)}\n\n${text}`;
    }
  }
}

function generateObsidian(result: ExtractionResult, tags: string[]): string {
  const allTags = [...(result.tags ?? []), ...tags];
  const frontmatter = [
    "---",
    `title: "${result.title}"`,
    `source: "${result.source}"`,
    `type: ${result.sourceType}`,
    `date: ${result.createdAt.split("T")[0]}`,
    `tags: [${allTags.map((t) => `"${t}"`).join(", ")}]`,
    `language: ${result.language}`,
    "---",
    "",
  ].join("\n");

  return frontmatter + generateMarkdownBody(result);
}

function generateNotionJson(result: ExtractionResult, tags: string[]): string {
  const data = {
    title: result.title,
    source: result.source,
    sourceType: result.sourceType,
    date: result.createdAt,
    tags: [...(result.tags ?? []), ...tags],
    summary: result.summary,
    keyIdeas: result.keyIdeas,
    flashcards: result.flashcards,
    structuredNotes: result.structuredNotes,
    extractedLinks: result.extractedLinks ?? [],
    codeSnippets: result.codeSnippets ?? [],
  };
  return JSON.stringify(data, null, 2);
}

function generateMarkdown(result: ExtractionResult): string {
  return generateMarkdownBody(result);
}

/** Красивый структурированный текст для удобного чтения и печати */
function generateReadable(result: ExtractionResult): string {
  const lines: string[] = [];
  const sepLong = "═".repeat(72);
  const sepMid = "─".repeat(72);
  const sepShort = "·".repeat(56);

  const dateStr = new Date(result.createdAt).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const sourceTypeLabels: Record<string, string> = {
    url: "Статья / веб-страница",
    pdf: "PDF-документ",
    youtube: "YouTube видео",
    text: "Вставленный текст",
    telegram: "Telegram",
    notion: "Notion",
    rss: "RSS",
    substack: "Веб-статья (Substack и др.)",
    github: "GitHub",
    reddit: "Reddit",
  };
  const sourceLabel = sourceTypeLabels[result.sourceType] ?? result.sourceType;

  const summaryWords = (result.summary ?? "").split(/\s+/).filter(Boolean).length;
  const ideasCount = (result.keyIdeas ?? []).length;
  const cardsCount = (result.flashcards ?? []).length;
  const totalWords = summaryWords + (result.structuredNotes ?? "").split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.ceil(totalWords / 200));

  // ─── ЗАГОЛОВОК ────────────────────────────────────────────────────────
  lines.push("");
  lines.push(sepLong);
  lines.push("");
  lines.push("  " + result.title.toUpperCase());
  lines.push("");
  lines.push("  Извлечённые знания — структурированный конспект");
  lines.push("");
  lines.push(sepLong);
  lines.push("");
  lines.push("  ОГЛАВЛЕНИЕ");
  lines.push("");
  lines.push("    1. Метаданные и статистика");
  lines.push("    2. Резюме");
  lines.push("    3. Ключевые идеи");
  lines.push("    4. Карточки для повторения");
  lines.push("    5. Структурированные заметки");
  lines.push("    6. Ссылки со страницы");
  lines.push("    7. Код и пояснения");
  lines.push("");
  lines.push(sepMid);
  lines.push("");
  lines.push("  1. МЕТАДАННЫЕ И СТАТИСТИКА");
  lines.push("");
  const sourceDisplay =
    (result.sourceType === "url" || result.sourceType === "youtube") && /^https?:\/\//.test(result.source)
      ? result.source
      : result.source;
  lines.push(`  📌 Источник:     ${sourceDisplay}`);
  lines.push(`  📁 Тип:          ${sourceLabel}`);
  lines.push(`  📅 Дата:         ${dateStr}`);
  lines.push(`  🌐 Язык:         ${result.language?.toUpperCase() ?? "—"}`);
  if ((result.tags ?? []).length > 0) {
    lines.push(`  🏷  Теги:         ${result.tags.join(" · ")}`);
  }
  lines.push("");
  lines.push("  Статистика:");
  lines.push(`     · Слов в резюме:     ${summaryWords}`);
  lines.push(`     · Ключевых идей:     ${ideasCount}`);
  lines.push(`     · Карточек:          ${cardsCount}`);
  lines.push(`     · Время чтения:      ~ ${readMins} мин`);
  lines.push("");
  lines.push(sepLong);
  lines.push("");
  lines.push("  2. РЕЗЮМЕ");
  lines.push("");
  lines.push("  " + (result.summary ?? "").replace(/\n+/g, "\n\n  ").trim());
  lines.push("");
  lines.push(sepMid);
  lines.push("");
  lines.push("  3. КЛЮЧЕВЫЕ ИДЕИ");
  lines.push("");
  (result.keyIdeas ?? []).forEach((idea, i) => {
    const num = String(i + 1).padStart(2, " ");
    lines.push(`     ${num}. ${idea.trim()}`);
    if (i < (result.keyIdeas?.length ?? 0) - 1) lines.push("");
  });
  lines.push("");
  lines.push(sepMid);
  lines.push("");
  lines.push("  4. КАРТОЧКИ ДЛЯ ПОВТОРЕНИЯ");
  lines.push("");
  lines.push(`     Всего карточек: ${cardsCount}`);
  lines.push("");
  (result.flashcards ?? []).forEach((fc, i) => {
    lines.push(sepShort);
    lines.push(`     Карточка ${i + 1}`);
    lines.push("");
    lines.push(`     ❓ Вопрос:  ${fc.question}`);
    lines.push(`     ✅ Ответ:   ${fc.answer}`);
    lines.push("");
  });
  lines.push(sepMid);
  lines.push("");
  lines.push("  5. СТРУКТУРИРОВАННЫЕ ЗАМЕТКИ");
  lines.push("");
  const cleanNotes = (result.structuredNotes ?? "")
    .replace(/^#{1,6}\s+/gm, (m) => {
      const level = m.match(/#/g)?.length ?? 1;
      return "\n  " + "  ".repeat(level - 1) + "◆ ";
    })
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^[-*]\s+/gm, "    • ")
    .replace(/^\d+\.\s+/gm, (m) => "    " + m)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  lines.push("  " + cleanNotes.replace(/\n/g, "\n  "));
  lines.push("");
  lines.push(sepMid);
  lines.push("");
  lines.push("  6. ССЫЛКИ СО СТРАНИЦЫ");
  lines.push("");
  const pageLinks = result.extractedLinks ?? [];
  if (pageLinks.length === 0) {
    lines.push("  (нет — источник без HTML или без подходящих ссылок)");
    lines.push("");
  } else {
    pageLinks.forEach((l, i) => {
      const num = String(i + 1).padStart(2, " ");
      lines.push(`     ${num}. ${l.label.trim() || l.href}`);
      if (l.description?.trim()) lines.push(`         ${l.description.trim().replace(/\s+/g, " ")}`);
      lines.push(`         ${l.href}`);
      if (i < pageLinks.length - 1) lines.push("");
    });
    lines.push("");
  }
  lines.push(sepMid);
  lines.push("");
  lines.push("  7. КОД И ПОЯСНЕНИЯ");
  lines.push("");
  const snippets = result.codeSnippets ?? [];
  if (snippets.length === 0) {
    lines.push("  (нет — в материале не выделено или модель не вернула codeSnippets)");
    lines.push("");
  } else {
    snippets.forEach((s, i) => {
      lines.push(`     ${i + 1}. ${s.title}`);
      if (s.language) lines.push(`        Язык: ${s.language}`);
      lines.push("");
      lines.push("        " + (s.code || "").replace(/\n/g, "\n        "));
      lines.push("");
      lines.push("        " + (s.explanation || "").replace(/\n/g, "\n        "));
      lines.push("");
    });
  }
  lines.push(sepLong);
  lines.push("");
  lines.push("  ─────────────────────────────────────────────────────────────");
  lines.push(`  ${APP_NAME} · v${APP_VERSION}`);
  const exportStr = new Date().toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  lines.push(`  Экспорт: ${exportStr}`);
  lines.push("  ─────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push(sepLong);

  return lines.join("\n");
}

function generateMarkdownBody(result: ExtractionResult): string {
  const lines: string[] = [];

  lines.push(`# ${result.title}`);
  lines.push("");
  lines.push(`> Источник: [${result.source}](${result.source})`);
  lines.push(`> Дата: ${new Date(result.createdAt).toLocaleDateString("ru-RU")}`);
  lines.push("");

  lines.push("## Резюме");
  lines.push("");
  lines.push(result.summary);
  lines.push("");

  lines.push("## Ключевые идеи");
  lines.push("");
  (result.keyIdeas ?? []).forEach((idea, i) => {
    lines.push(`${i + 1}. ${idea}`);
  });
  lines.push("");

  lines.push("## Карточки для повторения");
  lines.push("");
  (result.flashcards ?? []).forEach((fc, i) => {
    lines.push(`### Карточка ${i + 1}`);
    lines.push(`**В:** ${fc.question}`);
    lines.push(`**О:** ${fc.answer}`);
    lines.push("");
  });

  lines.push("## Структурированные заметки");
  lines.push("");
  lines.push(result.structuredNotes);

  const pageLinks = result.extractedLinks ?? [];
  if (pageLinks.length > 0) {
    lines.push("");
    lines.push("## Ссылки со страницы");
    lines.push("");
    for (const l of pageLinks) {
      const lab = (l.label || l.href).replace(/\]/g, "\\]").replace(/\[/g, "\\[");
      lines.push(`- [${lab}](${l.href})`);
      if (l.description?.trim()) {
        lines.push(`  - *${l.description.trim().replace(/\*/g, "\\*")}*`);
      }
    }
  }

  const snippets = result.codeSnippets ?? [];
  if (snippets.length > 0) {
    lines.push("");
    lines.push("## Код и пояснения");
    lines.push("");
    snippets.forEach((s, i) => {
      lines.push(`### ${i + 1}. ${s.title}`);
      if (s.language) lines.push(`*${s.language}*`);
      lines.push("");
      lines.push("```" + String(s.language || "").replace(/\s+/g, "") + "\n" + s.code + "\n```");
      lines.push("");
      lines.push(s.explanation);
      lines.push("");
    });
  }

  return lines.join("\n");
}

export function downloadFile(content: string, filename: string, ext: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadUint8Array(data: Uint8Array, filename: string, mime: string) {
  const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const blob = new Blob([ab], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
