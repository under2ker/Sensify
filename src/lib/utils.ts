import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

/** Фрагмент текста для предпросмотра экспорта без премиума (обрезка по границе строки). */
export function truncateExportPreviewForGuest(full: string, maxChars: number): string {
  if (full.length <= maxChars) return full;
  let body = full.slice(0, maxChars);
  const nl = body.lastIndexOf("\n");
  if (nl > Math.floor(maxChars * 0.4)) body = body.slice(0, nl);
  return body;
}

/** Короткая подпись для длинного URL (в списках ссылок) */
export function shortDisplayUrl(href: string, max = 68): string {
  try {
    const u = new URL(href);
    const host = u.hostname.replace(/^www\./, "");
    let path = u.pathname + u.search + u.hash;
    if (path.length > 44) {
      path = path.slice(0, 16) + "…" + path.slice(-24);
    }
    const s = `${host}${path || "/"}`;
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  } catch {
    return href.length > max ? href.slice(0, max - 1) + "…" : href;
  }
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

export function isTelegramUrl(url: string): boolean {
  return /(?:t\.me|telegram\.me|telegram\.dog)\//.test(url);
}

export function isNotionUrl(url: string): boolean {
  return /(?:notion\.so|notion\.site)\//.test(url);
}

export function isRssUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    return (
      /\.(rss|xml)$/i.test(path) ||
      /\/feed\/|\/rss\/|atom\.xml|feed\.xml|\.rss$/i.test(path) ||
      path.endsWith("/feed") ||
      path.endsWith("/rss")
    );
  } catch {
    return false;
  }
}

export function isSubstackUrl(url: string): boolean {
  return /substack\.com/.test(url);
}

export function isGithubUrl(url: string): boolean {
  return /(?:github\.com|githubusercontent\.com)\//.test(url);
}

export function isRedditUrl(url: string): boolean {
  return /(?:reddit\.com|redd\.it)\//.test(url);
}

/** Домен для favicon по типу источника и URL */
const FAVICON_DOMAINS: Record<string, string> = {
  youtube: "youtube.com",
  telegram: "telegram.org",
  notion: "notion.so",
  substack: "substack.com",
  github: "github.com",
  reddit: "reddit.com",
};

/** Возвращает URL иконки сайта (Google Favicon API) для отображения в шапке */
export function getFaviconUrl(source: string, sourceType: string): string | null {
  const domain = FAVICON_DOMAINS[sourceType];
  if (domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }
  if (sourceType === "url" || sourceType === "rss" || sourceType === "substack" || sourceType === "github" || sourceType === "reddit") {
    try {
      const u = new URL(source.startsWith("http") ? source : `https://${source}`);
      const host = u.hostname.replace(/^www\./, "");
      if (host) {
        return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
      }
    } catch {}
  }
  return null;
}

/** Русская транслитерация ISO 9 для slug (поиск по теме) */
const RU_TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
"абвгдеёжзийклмнопрстуфхцчшщъыьэюя".split("").forEach((c) => {
  RU_TRANSLIT[c.toUpperCase()] = RU_TRANSLIT[c].toUpperCase();
});

/** Преобразует строку в slug: дата + тема + тег, удобно для поиска */
export function slugify(str: string, maxLength = 50): string {
  let out = str
    .split("")
    .map((c) => RU_TRANSLIT[c] ?? (c.match(/[a-zA-Z0-9\-_\s]/) ? c : " "))
    .join("")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (out.length > maxLength) out = out.substring(0, maxLength).replace(/-$/, "");
  return out || "izvlechenie-znanij";
}

/** Находит похожие заметки по пересечению тегов и похожести заголовка */
export function findSimilarNotes(
  current: { id: string; tags: string[]; title: string },
  history: { id: string; tags: string[]; title: string }[],
  limit = 4
): { id: string; tags: string[]; title: string }[] {
  const others = history.filter((h) => h.id !== current.id);
  if (others.length === 0) return [];

  const currentTags = new Set((current.tags ?? []).map((t) => t.toLowerCase()));
  const currentTitle = (current.title ?? "").toLowerCase();

  const scored = others.map((item) => {
    const itemTags = new Set((item.tags ?? []).map((t) => t.toLowerCase()));
    const tagOverlap = [...currentTags].filter((t) => itemTags.has(t)).length;
    const titleWords = currentTitle.split(/\s+/).filter(Boolean);
    const titleMatch = titleWords.filter((w) =>
      (item.title ?? "").toLowerCase().includes(w)
    ).length;
    const score = tagOverlap * 2 + titleMatch;
    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}

/** Форматирует имя файла: YYYY-MM-DD_тема_тег (дата + тема + первый тег) */
export function formatExportFilename(
  title: string,
  date?: string,
  tags?: string[]
): string {
  const d = date ? new Date(date) : new Date();
  const dateStr = d.toISOString().slice(0, 10);
  const temaSlug = slugify(title || "znaniya", 40);
  const firstTag = tags?.filter((t) => t.trim().length > 0)[0];
  const tagSlug = firstTag ? slugify(firstTag, 20) : "";
  const parts = [dateStr, temaSlug];
  if (tagSlug && tagSlug !== temaSlug) parts.push(tagSlug);
  return parts.join("_");
}
