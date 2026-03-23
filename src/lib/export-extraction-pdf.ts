import type { ExtractionResult } from "@/types";
import type { PDFFont, PDFPage, RGB } from "pdf-lib";
import { APP_NAME, APP_VERSION } from "@/lib/app-config";

/** Roboto Regular — кириллица и латиница (Google Fonts). */
const ROBOTO_TTF =
  "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf";

let fontBytesCache: ArrayBuffer | null = null;

async function loadRobotoFontBytes(): Promise<ArrayBuffer> {
  if (fontBytesCache) return fontBytesCache;
  const res = await fetch(ROBOTO_TTF);
  if (!res.ok) throw new Error("Не удалось загрузить шрифт для PDF (проверьте сеть)");
  fontBytesCache = await res.arrayBuffer();
  return fontBytesCache;
}

function wrapLineToWidth(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return [];
  const words = t.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    let chunk = word;
    while (font.widthOfTextAtSize(chunk, fontSize) > maxWidth && chunk.length > 1) {
      let cut = 1;
      for (let i = 2; i <= chunk.length; i++) {
        if (font.widthOfTextAtSize(chunk.slice(0, i), fontSize) <= maxWidth) cut = i;
        else break;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(chunk.slice(0, cut));
      chunk = chunk.slice(cut);
    }
    const test = line ? `${line} ${chunk}` : chunk;
    if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = chunk;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function wrapParagraphs(
  body: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const out: string[] = [];
  const parts = body.split(/\n+/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }
    out.push(...wrapLineToWidth(trimmed, font, fontSize, maxWidth));
  }
  return out;
}

type DrawContext = {
  doc: import("pdf-lib").PDFDocument;
  page: PDFPage;
  font: PDFFont;
  margin: number;
  maxW: number;
  y: number;
};

function ensureSpace(ctx: DrawContext, needFromBottom: number): void {
  if (ctx.y - needFromBottom >= ctx.margin) return;
  ctx.page = ctx.doc.addPage([595, 842]);
  ctx.y = 842 - ctx.margin;
}

function drawTextLines(
  ctx: DrawContext,
  lines: string[],
  size: number,
  color: RGB,
  gapAfter = 8
): void {
  const lh = size * 1.35;
  for (const line of lines) {
    ensureSpace(ctx, lh + 4);
    if (line === "") {
      ctx.y -= lh * 0.5;
      continue;
    }
    ctx.page.drawText(line, {
      x: ctx.margin,
      y: ctx.y,
      size,
      font: ctx.font,
      color,
    });
    ctx.y -= lh;
  }
  ctx.y -= gapAfter;
}

function drawHeading(ctx: DrawContext, title: string, size = 13, color: RGB): void {
  const lines = wrapLineToWidth(title, ctx.font, size, ctx.maxW);
  drawTextLines(ctx, lines, size, color, 10);
}

/** PDF с извлечённым результатом или сохранённой страницей (A4, кириллица). */
export async function buildExtractionPdf(input: {
  result?: ExtractionResult;
  savedPage?: { title: string; content: string; source: string };
  extraTags?: string[];
}): Promise<Uint8Array> {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const bytes = await loadRobotoFontBytes();
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(bytes);

  const margin = 48;
  const maxW = 595 - margin * 2;
  const textDark = rgb(0.12, 0.12, 0.14);
  const textMuted = rgb(0.45, 0.45, 0.48);

  const ctx: DrawContext = {
    doc,
    page: doc.addPage([595, 842]),
    font,
    margin,
    maxW,
    y: 842 - margin,
  };

  if (input.savedPage) {
    const { title, content, source } = input.savedPage;
    drawHeading(ctx, title, 18, textDark);
    drawTextLines(
      ctx,
      wrapLineToWidth(`Источник: ${source}`, font, 10, maxW),
      10,
      textMuted,
      6
    );
    drawTextLines(ctx, wrapParagraphs(content, font, 11, maxW), 11, textDark, 12);
  } else if (input.result) {
    const r = input.result;
    const tags = [...(r.tags ?? []), ...(input.extraTags ?? [])];

    drawHeading(ctx, r.title, 18, textDark);
    const meta = [
      `Источник: ${r.source}`,
      `Тип: ${r.sourceType} · ${new Date(r.createdAt).toLocaleString("ru-RU")}`,
      tags.length ? `Теги: ${tags.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    drawTextLines(ctx, wrapLineToWidth(meta, font, 9, maxW), 9, textMuted, 10);

    drawHeading(ctx, "Резюме", 13, textDark);
    drawTextLines(ctx, wrapParagraphs(r.summary ?? "", font, 11, maxW), 11, textDark, 10);

    if ((r.keyIdeas ?? []).length) {
      drawHeading(ctx, "Ключевые идеи", 13, textDark);
      (r.keyIdeas ?? []).forEach((idea, i) => {
        drawTextLines(
          ctx,
          wrapParagraphs(`${i + 1}. ${idea}`, font, 11, maxW),
          11,
          textDark,
          6
        );
      });
      ctx.y -= 4;
    }

    if ((r.flashcards ?? []).length) {
      drawHeading(ctx, "Карточки", 13, textDark);
      (r.flashcards ?? []).forEach((fc) => {
        drawTextLines(
          ctx,
          wrapParagraphs(`В: ${fc.question}\nО: ${fc.answer}`, font, 10, maxW),
          10,
          textDark,
          8
        );
      });
    }

    if ((r.structuredNotes ?? "").trim()) {
      drawHeading(ctx, "Структурированные заметки", 13, textDark);
      drawTextLines(
        ctx,
        wrapParagraphs(r.structuredNotes ?? "", font, 10, maxW),
        10,
        textDark,
        10
      );
    }

    const links = r.extractedLinks ?? [];
    if (links.length) {
      drawHeading(ctx, "Ссылки", 13, textDark);
      links.forEach((l) => {
        const line = `${l.label || l.href}\n${l.href}${l.description?.trim() ? `\n${l.description.trim()}` : ""}`;
        drawTextLines(ctx, wrapParagraphs(line, font, 9, maxW), 9, textDark, 6);
      });
    }

    const codes = r.codeSnippets ?? [];
    if (codes.length) {
      drawHeading(ctx, "Код", 13, textDark);
      codes.forEach((s) => {
        const block = `${s.title}${s.language ? ` (${s.language})` : ""}\n${s.code}\n${s.explanation}`;
        drawTextLines(ctx, wrapParagraphs(block, font, 9, maxW), 9, textDark, 8);
      });
    }
  }

  ensureSpace(ctx, 24);
  ctx.page.drawText(`${APP_NAME} v${APP_VERSION} · экспорт PDF`, {
    x: ctx.margin,
    y: ctx.margin,
    size: 8,
    font: ctx.font,
    color: textMuted,
  });

  return doc.save();
}
