import { z } from "zod";
import type { InputType } from "@/types";
import {
  isValidUrl,
  isGithubUrl,
  isRedditUrl,
  isYouTubeUrl,
  isTelegramUrl,
  isNotionUrl,
  isRssUrl,
} from "@/lib/utils";

const nonEmpty = z.string().trim().min(1, "Заполните поле");

const urlTabSchema = nonEmpty.refine((s) => isValidUrl(s), "Некорректный URL");
const githubTabSchema = nonEmpty.refine((s) => isGithubUrl(s), "Нужна ссылка на GitHub (github.com/...)");
const redditTabSchema = nonEmpty.refine((s) => isRedditUrl(s), "Нужна ссылка на Reddit");
const youtubeTabSchema = nonEmpty.refine((s) => isYouTubeUrl(s), "Нужна ссылка на YouTube");
const telegramTabSchema = nonEmpty.refine((s) => isTelegramUrl(s), "Нужна ссылка на Telegram (t.me/...)");
const notionTabSchema = nonEmpty.refine((s) => isNotionUrl(s), "Нужна публичная ссылка на Notion");
const rssTabSchema = nonEmpty.refine((s) => isRssUrl(s), "Нужна ссылка на RSS или Atom-фид");
const textTabSchema = z
  .string()
  .trim()
  .min(50, "Минимум 50 символов для извлечения");

const tabSchemas: Partial<Record<InputType, z.ZodType<string>>> = {
  url: urlTabSchema,
  github: githubTabSchema,
  reddit: redditTabSchema,
  youtube: youtubeTabSchema,
  telegram: telegramTabSchema,
  notion: notionTabSchema,
  rss: rssTabSchema,
  text: textTabSchema,
};

function firstZodMessage(err: z.ZodError): string {
  const msg = err.issues[0]?.message;
  return msg && msg.length > 0 ? msg : "Ошибка ввода";
}

export type ExtractInputValidationResult = { ok: true } | { ok: false; message: string };

/** Валидация перед отправкой на /api/extract */
export function validateExtractInput(
  tab: InputType,
  rawInput: string,
  pdfFile: File | null,
): ExtractInputValidationResult {
  if (tab === "pdf") {
    if (!pdfFile) return { ok: false, message: "Выберите PDF-файл" };
    return { ok: true };
  }
  const schema = tabSchemas[tab];
  if (!schema) return { ok: true };
  const r = schema.safeParse(rawInput);
  if (r.success) return { ok: true };
  return { ok: false, message: firstZodMessage(r.error) };
}

/**
 * Красная обводка: есть непустой ввод, но он ещё не подходит под тип вкладки
 * (пустое поле не подсвечиваем).
 */
export function isExtractFieldInvalid(tab: InputType, rawInput: string, pdfFile: File | null): boolean {
  if (tab === "pdf") return false;
  const v = rawInput.trim();
  if (!v) return false;
  if (tab === "text") return v.length < 50;
  switch (tab) {
    case "url":
      return !isValidUrl(v);
    case "github":
      return !isGithubUrl(v);
    case "reddit":
      return !isRedditUrl(v);
    case "youtube":
      return !isYouTubeUrl(v);
    case "telegram":
      return !isTelegramUrl(v);
    case "notion":
      return !isNotionUrl(v);
    case "rss":
      return !isRssUrl(v);
    default:
      return false;
  }
}
