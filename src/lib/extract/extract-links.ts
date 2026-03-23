import type { ExtractedLink } from "@/types";

function parseHrefFromAttrs(attrs: string): string | null {
  let m = attrs.match(/\bhref\s*=\s*"([^"]*)"/i);
  if (m) return m[1].trim();
  m = attrs.match(/\bhref\s*=\s*'([^']*)'/i);
  if (m) return m[1].trim();
  m = attrs.match(/\bhref\s*=\s*([^\s>]+)/i);
  if (m) return m[1].replace(/&amp;/g, "&").trim();
  return null;
}

function parseAttr(attrs: string, name: string): string {
  const dq = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i").exec(attrs);
  if (dq?.[1]) return decodeBasicEntities(dq[1]).trim();
  const sq = new RegExp(`\\b${name}\\s*=\\s*'([^']*)'`, "i").exec(attrs);
  if (sq?.[1]) return decodeBasicEntities(sq[1]).trim();
  return "";
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripInnerTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Буквы (включая кириллицу) */
function letterCount(s: string): number {
  return (s.match(/\p{L}/gu) ?? []).length;
}

/** Остаток похож на обломки разметки / атрибутов (как в навбарах сайтов) */
function looksLikeMarkupNoise(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  if (/[<>]/.test(t)) return true;
  if (/=\s*["']/.test(t)) return true;
  if (/\b(src|href|alt|class|width|height|style|role|aria-|data-[\w-]+)\s*=/i.test(t)) return true;
  if (/ge-icon|nav-icon|menu-icon|skip\s+to|skip\s+navigation/i.test(t)) return true;
  if (/\/?>\s*$/.test(t)) return true;
  if (/^["'`][^"'`]*["'`]\s*$/i.test(t)) return true;
  if (/^\W{3,}/.test(t) && letterCount(t) < 6) return true;
  // Подряд много «слов» как токены разметки
  const tokens = t.split(/\s+/).filter(Boolean);
  const attrLike = tokens.filter((w) => /^[=/"']|^\d+px$|^[.#][\w-]+$/i.test(w) || /^\d+x\d+$/i.test(w));
  if (tokens.length >= 4 && attrLike.length / tokens.length > 0.35) return true;
  return false;
}

/**
 * Человекочитаемое описание ссылки; иначе null (не показывать мусор).
 */
function sanitizeLinkDescription(raw: string, maxLen = 220): string | null {
  if (!raw) return null;
  const t = raw.replace(/\s+/g, " ").trim();
  if (t.length < 14) return null;
  if (looksLikeMarkupNoise(t)) return null;
  if (letterCount(t) < 10) return null;
  // Обрезать по последнему осмысленному концу предложения
  const slice = t.slice(0, maxLen + 40);
  let cut = slice.slice(0, maxLen);
  const lastPeriod = cut.lastIndexOf(". ");
  if (lastPeriod > 50) cut = cut.slice(0, lastPeriod + 1);
  else {
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > 40) cut = cut.slice(0, lastSpace);
  }
  cut = cut.trim();
  if (cut.length < 14 || letterCount(cut) < 10) return null;
  if (looksLikeMarkupNoise(cut)) return null;
  return cut;
}

function humanLabelFromUrl(absolute: string): string {
  try {
    const u = new URL(absolute);
    const seg = u.pathname.split("/").filter(Boolean).pop();
    if (seg) {
      const decoded = decodeURIComponent(seg).replace(/[-_+.]/g, " ").replace(/\.(html?|php|aspx?)$/i, "");
      if (decoded.length > 2 && letterCount(decoded) >= 2) return decoded.slice(0, 200);
    }
    return u.hostname.replace(/^www\./, "").slice(0, 120);
  } catch {
    return absolute.slice(0, 80);
  }
}

/** Ресурсы-«картинки/шрифты», трекинг — не показываем в списке ссылок */
function shouldSkipUrl(href: string): boolean {
  if (href.length > 2048) return true;
  try {
    const u = new URL(href);
    const path = u.pathname.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|svg|ico|avif|bmp)(\?|$)/i.test(path)) return true;
    if (/\.(woff2?|ttf|eot|otf)(\?|$)/i.test(path)) return true;
    if (/\.(css|js|mjs|map)(\?|$)/i.test(path)) return true;
    if (/\.(pdf|zip|tar|gz)(\?|$)/i.test(path)) return true;
    const h = u.hostname.toLowerCase();
    if (h === "www.google-analytics.com" || h === "www.googletagmanager.com") return true;
    if (h.endsWith("doubleclick.net") || h.endsWith("googlesyndication.com")) return true;
    return false;
  } catch {
    return true;
  }
}

/**
 * Собирает уникальные http(s)-ссылки из HTML (теги <a href>).
 */
export function extractLinksFromHtml(
  html: string,
  baseUrl: string,
  options?: { max?: number }
): ExtractedLink[] {
  const max = options?.max ?? 80;
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

  const seen = new Set<string>();
  const out: ExtractedLink[] = [];

  const re = /<a\b([^>]*?)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(withoutScripts)) !== null && out.length < max) {
    const attrs = m[1];
    const idx = m.index;
    const innerRaw = m[2] || "";
    const inner = stripInnerTags(innerRaw);
    const rawHref = parseHrefFromAttrs(attrs);
    if (!rawHref) continue;
    const href = rawHref.trim();
    const lower = href.toLowerCase();
    if (
      !href ||
      lower.startsWith("javascript:") ||
      lower.startsWith("mailto:") ||
      lower.startsWith("tel:") ||
      lower.startsWith("data:") ||
      lower.startsWith("#")
    ) {
      continue;
    }

    let absolute: string;
    try {
      absolute = new URL(href, baseUrl).href;
    } catch {
      continue;
    }

    if (!/^https?:\/\//i.test(absolute)) continue;
    if (shouldSkipUrl(absolute)) continue;

    const key = absolute.split("#")[0];
    if (seen.has(key)) continue;
    seen.add(key);

    let label = (inner || "").slice(0, 240);
    if (!label.trim() || looksLikeMarkupNoise(label) || letterCount(label) < 2) {
      label = humanLabelFromUrl(absolute);
    }

    const titleAttr = parseAttr(attrs, "title") || parseAttr(attrs, "aria-label");
    const before = withoutScripts.slice(Math.max(0, idx - 1200), idx);
    const contextFlat = stripInnerTags(before).replace(/\s+/g, " ").trim();
    const contextShort = contextFlat.slice(-200).trim();

    let description =
      sanitizeLinkDescription(titleAttr) ?? sanitizeLinkDescription(contextShort) ?? null;
    if (description && description.toLowerCase() === label.trim().toLowerCase()) description = null;

    out.push({
      href: absolute,
      label,
      ...(description ? { description } : {}),
    });
  }

  return out;
}
