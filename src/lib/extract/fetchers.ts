/**
 * Загрузка контента из разных источников для extract.
 */

import type { ExtractedLink } from "@/types";
import { fetchWithRetry, URL_FETCH_TIMEOUT } from "@/lib/fetch-safe";
import { extractLinksFromHtml } from "@/lib/extract/extract-links";
import { extractCodeBlocksFromHtml, type CodeCandidate } from "@/lib/extract/extract-code";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const REDDIT_JSON_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

/** Reddit часто отдаёт HTML 403 ботам с сервера — не используем fetchUrlContent как запасной вариант */
const REDDIT_ACCESS_ERROR =
  "Reddit ограничил доступ с сервера (часто 403 на HTML). Используйте прямую ссылку на пост: reddit.com/r/…/comments/…/…/ — или вкладку «Текст» и вставьте содержимое вручную. Для вики попробуйте ту же страницу в браузере и скопируйте текст.";

const JUNK_PATTERNS =
  /ad|banner|logo|icon|pixel|tracking|analytics|1x1|spacer|placeholder|sprite|favicon|avatar|button|arrow|loader|spinner|social|share|widget/i;
const MIN_SIZE = 200;

/** Извлекает главное изображение страницы, отсекая мусор (иконки, баннеры, трекинг) */
export function extractMainImageUrl(html: string, pageUrl: string): string | null {
  const resolve = (href: string): string => {
    if (!href || href.startsWith("data:")) return "";
    try {
      return new URL(href, pageUrl).href;
    } catch {
      return "";
    }
  };

  const isJunk = (url: string, attrs: string): boolean => {
    const combined = (url + " " + attrs).toLowerCase();
    if (JUNK_PATTERNS.test(combined)) return true;
    if (url.includes("1x1") || url.includes("0x0")) return true;
    if (url.endsWith(".svg") && !url.includes("illustration")) return true;
    return false;
  };

  const ogMatch =
    html.match(/<meta\s+(?:property="og:image"|name="og:image")\s+content="([^"]+)"/i) ||
    html.match(/<meta\s+content="([^"]+)"\s+(?:property="og:image"|name="og:image")/i);
  if (ogMatch?.[1]) {
    const url = resolve(ogMatch[1].trim());
    if (url && !isJunk(url, "")) return url;
  }

  const twMatch =
    html.match(/<meta\s+(?:name="twitter:image"|property="twitter:image")\s+content="([^"]+)"/i) ||
    html.match(/<meta\s+content="([^"]+)"\s+(?:name="twitter:image"|property="twitter:image")/i);
  if (twMatch?.[1]) {
    const url = resolve(twMatch[1].trim());
    if (url && !isJunk(url, "")) return url;
  }

  const articleBlock =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
    html;
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(articleBlock)) !== null) {
    const src = m[1].trim();
    const fullTag = m[0];
    const url = resolve(src);
    if (!url || isJunk(url, fullTag)) continue;
    const wMatch = fullTag.match(/width=["']?(\d+)/i);
    const hMatch = fullTag.match(/height=["']?(\d+)/i);
    const w = wMatch ? parseInt(wMatch[1], 10) : 0;
    const h = hMatch ? parseInt(hMatch[1], 10) : 0;
    if (w > 0 && h > 0 && (w < MIN_SIZE || h < MIN_SIZE)) continue;
    return url;
  }

  if (articleBlock === html) {
    imgRegex.lastIndex = 0;
    while ((m = imgRegex.exec(html)) !== null) {
      const src = m[1].trim();
      const fullTag = m[0];
      const url = resolve(src);
      if (!url || isJunk(url, fullTag)) continue;
      const wMatch = fullTag.match(/width=["']?(\d+)/i);
      const hMatch = fullTag.match(/height=["']?(\d+)/i);
      const w = wMatch ? parseInt(wMatch[1], 10) : 0;
      const h = hMatch ? parseInt(hMatch[1], 10) : 0;
      if (w > 0 && h > 0 && (w < MIN_SIZE || h < MIN_SIZE)) continue;
      return url;
    }
  }

  return null;
}

/** Быстрое извлечение og:image из HTML */
export function extractOgImage(html: string, baseUrl: string): string | null {
  const m =
    html.match(/<meta\s+(?:property="og:image"|name="og:image")\s+content="([^"]+)"/i) ||
    html.match(/<meta\s+content="([^"]+)"\s+(?:property="og:image"|name="og:image")/i);
  if (!m?.[1]) return null;
  const href = m[1].trim();
  if (href.startsWith("data:")) return null;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

export async function fetchUrlContent(
  url: string
): Promise<{ text: string; imageUrl: string | null; links: ExtractedLink[]; codeCandidates: CodeCandidate[] }> {
  const res = await fetchWithRetry(url, {
    headers: { "User-Agent": USER_AGENT },
    timeout: URL_FETCH_TIMEOUT,
    retries: 1,
  });

  if (!res.ok)
    throw new Error(
      `Не удалось загрузить страницу (код ${res.status}). Проверьте ссылку и доступность сайта.`
    );

  const html = await res.text();
  const imageUrl = extractMainImageUrl(html, url);
  const links = extractLinksFromHtml(html, url);
  const codeCandidates = extractCodeBlocksFromHtml(html);

  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return { text: textContent.substring(0, 15000), imageUrl, links, codeCandidates };
}

const GITHUB_API_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "application/vnd.github+json",
};

function truncateFetchText(s: string, max = 15000): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max) : t;
}

async function fetchPlainTextUrl(url: string): Promise<string> {
  const res = await fetchWithRetry(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/plain,*/*" },
    timeout: URL_FETCH_TIMEOUT,
    retries: 1,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function decodeGitHubReadmeBase64(b64: string): string {
  const compact = b64.replace(/\n/g, "");
  if (typeof Buffer === "undefined") {
    throw new Error("Buffer unavailable");
  }
  return Buffer.from(compact, "base64").toString("utf8");
}

async function fetchGitHubReadme(
  owner: string,
  repo: string,
  ref?: string
): Promise<string> {
  let api = `https://api.github.com/repos/${owner}/${repo}/readme`;
  if (ref) api += `?ref=${encodeURIComponent(ref)}`;
  const res = await fetchWithRetry(api, {
    headers: GITHUB_API_HEADERS,
    timeout: URL_FETCH_TIMEOUT,
    retries: 1,
  });
  if (!res.ok) throw new Error(`readme ${res.status}`);
  const j = (await res.json()) as {
    download_url?: string | null;
    content?: string;
    encoding?: string;
  };
  if (j.download_url) {
    return fetchPlainTextUrl(j.download_url);
  }
  if (j.content && j.encoding === "base64") {
    return decodeGitHubReadmeBase64(j.content);
  }
  throw new Error("readme format");
}

async function fetchGitHubIssueOrPull(
  owner: string,
  repo: string,
  kind: "issues" | "pulls",
  num: string
): Promise<string> {
  const res = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/${kind}/${num}`, {
    headers: GITHUB_API_HEADERS,
    timeout: URL_FETCH_TIMEOUT,
    retries: 1,
  });
  if (!res.ok) throw new Error(`${kind} ${res.status}`);
  const j = (await res.json()) as { title?: string; body?: string | null; user?: { login?: string } };
  const label = kind === "issues" ? "Issue" : "Pull request";
  const title = j.title || "";
  const body = j.body || "";
  const user = j.user?.login || "";
  return `${label} #${num} (${owner}/${repo})\nАвтор: ${user}\nЗаголовок: ${title}\n\n${body}`;
}

function collectRedditTopComments(children: unknown[] | undefined, max: number): string[] {
  const out: string[] = [];
  if (!Array.isArray(children)) return out;
  const rows: { score: number; body: string }[] = [];
  for (const c of children) {
    if (typeof c !== "object" || c === null) continue;
    const rec = c as { kind?: string; data?: Record<string, unknown> };
    if (rec.kind !== "t1" || !rec.data) continue;
    const d = rec.data;
    if (d.stickied === true) continue;
    const body = typeof d.body === "string" ? d.body.trim() : "";
    if (!body || body === "[deleted]" || body === "[removed]") continue;
    rows.push({ score: typeof d.score === "number" ? d.score : 0, body });
  }
  rows.sort((a, b) => b.score - a.score);
  for (const r of rows) {
    out.push(r.body);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * GitHub: README через API, raw для blob, issue/PR через API, tree + path через contents.
 * При сбое — обычная HTML-загрузка.
 */
export async function fetchGithubContent(url: string): Promise<{
  text: string;
  imageUrl: string | null;
  links: ExtractedLink[];
  codeCandidates: CodeCandidate[];
}> {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const u = new URL(normalized);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "raw.githubusercontent.com" || host === "raw.github.com") {
      const text = await fetchPlainTextUrl(u.toString());
      return { text: truncateFetchText(text), imageUrl: null, links: [], codeCandidates: [] };
    }

    if (host !== "github.com") {
      return fetchUrlContent(url);
    }

    const path = u.pathname.replace(/\/+$/, "") || "/";

    const mBlob = path.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
    if (mBlob) {
      const [, owner, repo, ref, filePath] = mBlob;
      const raw = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`;
      const text = await fetchPlainTextUrl(raw);
      return { text: truncateFetchText(text), imageUrl: null, links: [], codeCandidates: [] };
    }

    const mIssue = path.match(/^\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (mIssue) {
      const [, owner, repo, num] = mIssue;
      const text = await fetchGitHubIssueOrPull(owner, repo, "issues", num);
      return { text: truncateFetchText(text), imageUrl: null, links: [], codeCandidates: [] };
    }

    const mPull = path.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (mPull) {
      const [, owner, repo, num] = mPull;
      const text = await fetchGitHubIssueOrPull(owner, repo, "pulls", num);
      return { text: truncateFetchText(text), imageUrl: null, links: [], codeCandidates: [] };
    }

    const mTree = path.match(/^\/([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.*))?$/);
    if (mTree) {
      const [, owner, repo, ref, subpath] = mTree;
      if (!subpath) {
        const text = await fetchGitHubReadme(owner, repo, ref);
        return { text: truncateFetchText(text), imageUrl: null, links: [], codeCandidates: [] };
      }
      const encPath = subpath
        .split("/")
        .filter(Boolean)
        .map((s) => encodeURIComponent(s))
        .join("/");
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encPath}?ref=${encodeURIComponent(ref)}`;
      const res = await fetchWithRetry(apiUrl, {
        headers: GITHUB_API_HEADERS,
        timeout: URL_FETCH_TIMEOUT,
        retries: 1,
      });
      if (res.ok) {
        const j = (await res.json()) as { type?: string; download_url?: string | null };
        if (j.type === "file" && j.download_url) {
          const text = await fetchPlainTextUrl(j.download_url);
          return { text: truncateFetchText(text), imageUrl: null, links: [], codeCandidates: [] };
        }
      }
      return fetchUrlContent(url);
    }

    const mRepo = path.match(/^\/([^/]+)\/([^/]+)$/);
    if (mRepo) {
      const [, owner, repo] = mRepo;
      const text = await fetchGitHubReadme(owner, repo);
      return { text: truncateFetchText(text), imageUrl: null, links: [], codeCandidates: [] };
    }

    return fetchUrlContent(url);
  } catch {
    return fetchUrlContent(url);
  }
}

function parseRedditWikiMarkdown(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const inner = root.data;
  if (!inner || typeof inner !== "object") return null;
  const d = inner as Record<string, unknown>;
  const md = typeof d.content_md === "string" ? d.content_md : typeof d.content === "string" ? d.content : "";
  const title = typeof d.title === "string" ? d.title : "Wiki";
  if (md.trim().length < 20) return null;
  return `Reddit Wiki: ${title}\n\n${md.trim()}`;
}

function parseRedditListingThread(data: unknown): { text: string; links: ExtractedLink[] } | null {
  if (!Array.isArray(data) || data.length < 1) return null;

  const postWrap = (data[0] as { data?: { children?: unknown[] } })?.data?.children?.[0] as
    | { data?: Record<string, unknown> }
    | undefined;
  const post = postWrap?.data;
  if (!post || typeof post !== "object") return null;

  const title = String(post.title || "");
  const selftext = String(post.selftext || "");
  const author = String(post.author || "");
  const sub = String(post.subreddit_name_prefixed || post.subreddit || "");
  const linkUrl = post.url ? String(post.url) : "";
  const isSelf = post.is_self === true;

  const parts: string[] = [`Reddit: ${sub}`, `Пост (u/${author}): ${title}`];
  if (isSelf && selftext) parts.push(selftext);
  else if (!isSelf && linkUrl) parts.push(`Ссылка поста: ${linkUrl}`);
  else if (selftext) parts.push(selftext);

  const commentsRoot = (data[1] as { data?: { children?: unknown[] } } | undefined)?.data?.children;
  const comments = collectRedditTopComments(commentsRoot, 18);
  if (comments.length) {
    parts.push("\n--- Комментарии (выборка по рейтингу) ---\n");
    comments.forEach((c, i) => parts.push(`${i + 1}. ${c}`));
  }

  const text = parts.filter(Boolean).join("\n\n").trim();
  if (text.length < 30) return null;

  const links: ExtractedLink[] = [];
  if (!isSelf && linkUrl && /^https?:\/\//i.test(linkUrl)) {
    try {
      const host = new URL(linkUrl).hostname.replace(/^www\./, "");
      if (!host.includes("reddit.com") && !host.endsWith("redd.it")) {
        links.push({
          href: linkUrl,
          label: (title || linkUrl).slice(0, 240),
        });
      }
    } catch {
      /* ignore */
    }
  }
  return { text, links };
}

/**
 * Reddit: только JSON API (тред или wiki). HTML не трогаем — с сервера почти всегда 403.
 */
export async function fetchRedditContent(url: string): Promise<{
  text: string;
  imageUrl: string | null;
  links: ExtractedLink[];
  codeCandidates: CodeCandidate[];
}> {
  let pageUrl = url.startsWith("http") ? url : `https://${url}`;

  const probe = await fetchWithRetry(pageUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
    },
    timeout: URL_FETCH_TIMEOUT,
    retries: 0,
  });

  if (probe.ok) {
    await probe.text().catch(() => {});
    pageUrl = probe.url;
  } else if (probe.status === 403 || probe.status === 401) {
    try {
      const u = new URL(pageUrl);
      if (u.hostname.includes("reddit.com")) {
        const oldProbe = await fetchWithRetry(`https://old.reddit.com${u.pathname}${u.search}`, {
          headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
          timeout: URL_FETCH_TIMEOUT,
          retries: 0,
        });
        if (oldProbe.ok) {
          await oldProbe.text().catch(() => {});
          pageUrl = oldProbe.url;
        }
      }
    } catch {
      /* keep pageUrl */
    }
  }

  let u = new URL(pageUrl);
  if (u.hostname === "redd.it" || u.hostname === "www.reddit.it") {
    pageUrl = `https://www.reddit.com${u.pathname}${u.search}`;
    u = new URL(pageUrl);
  }
  if (!u.hostname.replace(/^www\./, "").endsWith("reddit.com")) {
    throw new Error("Ожидалась ссылка на reddit.com (пост, тред или wiki) или короткая redd.it/…");
  }

  let pathname = u.pathname.replace(/\/+$/, "") || "/";
  if (!pathname.endsWith(".json")) pathname += ".json";

  const jsonOrigins = Array.from(
    new Set([u.origin, "https://www.reddit.com", "https://old.reddit.com"])
  );

  let lastStatus = 0;
  let data: unknown = null;

  for (const origin of jsonOrigins) {
    const jsonUrl = `${origin}${pathname}`;
    const res = await fetchWithRetry(jsonUrl, {
      headers: REDDIT_JSON_HEADERS,
      timeout: URL_FETCH_TIMEOUT,
      retries: 1,
    });
    lastStatus = res.status;
    if (!res.ok) continue;
    try {
      data = await res.json();
    } catch {
      continue;
    }
    break;
  }

  if (data === null) {
    throw new Error(
      `${REDDIT_ACCESS_ERROR} (последний ответ JSON: HTTP ${lastStatus || "—"}).`
    );
  }

  const thread = parseRedditListingThread(data);
  if (thread) {
    return {
      text: truncateFetchText(thread.text),
      imageUrl: null,
      links: thread.links,
      codeCandidates: [],
    };
  }

  const wikiText = parseRedditWikiMarkdown(data);
  if (wikiText) {
    return {
      text: truncateFetchText(wikiText),
      imageUrl: null,
      links: [],
      codeCandidates: [],
    };
  }

  throw new Error(
    `${REDDIT_ACCESS_ERROR} Формат ответа Reddit не распознан (возможно, не пост и не wiki).`
  );
}

export async function fetchTelegramContent(
  url: string
): Promise<{ text: string; imageUrl: string | null; links: ExtractedLink[]; codeCandidates: CodeCandidate[] }> {
  const res = await fetchWithRetry(url, {
    headers: { "User-Agent": USER_AGENT },
    timeout: URL_FETCH_TIMEOUT,
    retries: 1,
  });

  if (!res.ok)
    throw new Error(
      `Не удалось загрузить пост Telegram (код ${res.status}). Убедитесь, что канал или пост публичный.`
    );

  const html = await res.text();
  const links = extractLinksFromHtml(html, url);
  const codeCandidates = extractCodeBlocksFromHtml(html);

  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1] || "";
  const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i)?.[1] || "";
  const tgPost =
    html.match(/<meta\s+property="twitter:description"\s+content="([^"]*)"/i)?.[1] || "";

  const text = [ogTitle, ogDesc, tgPost]
    .filter(Boolean)
    .join("\n\n")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  if (text.trim().length < 30) {
    const fallback = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (fallback.length > 50)
      return {
        text: fallback.substring(0, 15000),
        imageUrl: extractOgImage(html, url),
        links,
        codeCandidates,
      };
    throw new Error(
      "Не удалось извлечь текст из Telegram. Пост может быть приватным или недоступным."
    );
  }
  return { text: text.substring(0, 15000), imageUrl: extractOgImage(html, url), links, codeCandidates };
}

export async function fetchNotionContent(
  url: string
): Promise<{ text: string; imageUrl: string | null; links: ExtractedLink[]; codeCandidates: CodeCandidate[] }> {
  const res = await fetchWithRetry(url, {
    headers: { "User-Agent": USER_AGENT },
    timeout: URL_FETCH_TIMEOUT,
    retries: 1,
  });

  if (!res.ok)
    throw new Error(
      `Не удалось загрузить страницу Notion (код ${res.status}). Убедитесь, что страница опубликована для веб-доступа.`
    );

  const html = await res.text();
  const links = extractLinksFromHtml(html, url);
  const codeCandidates = extractCodeBlocksFromHtml(html);
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 50)
    throw new Error(
      "Страница Notion пуста или недоступна. Проверьте настройки публикации."
    );
  return { text: text.substring(0, 15000), imageUrl: extractOgImage(html, url), links, codeCandidates };
}

export async function fetchRssContent(url: string): Promise<string> {
  const res = await fetchWithRetry(url, {
    headers: { "User-Agent": USER_AGENT },
    timeout: URL_FETCH_TIMEOUT,
    retries: 1,
  });

  if (!res.ok)
    throw new Error(
      `Не удалось загрузить RSS-ленту (код ${res.status}). Проверьте ссылку на фид.`
    );

  const xml = await res.text();
  const items: string[] = [];

  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = (m[1] || m[2] || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (block.length > 20) items.push(block);
  }

  const titleMatch = xml.match(/<title[^>]*>([^<]+)</i);
  const channelTitle = titleMatch ? titleMatch[1].trim() : "RSS-лента";

  if (items.length === 0) {
    const descMatch = xml.match(/<description[^>]*>([^<]+)</i);
    if (descMatch) items.push(descMatch[1].trim());
  }

  const content = `${channelTitle}\n\n${items.slice(0, 20).join("\n\n")}`.trim();
  if (content.length < 50)
    throw new Error(
      "RSS-лента пуста или формат не распознан. Убедитесь, что это валидный RSS/Atom фид."
    );
  return content.substring(0, 15000);
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s#]+)/,
    /(?:youtu\.be\/)([^?\s#]+)/,
    /(?:youtube\.com\/embed\/)([^?\s#]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s#]+)/,
    /(?:youtube\.com\/live\/)([^?\s#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function fetchYouTubeTranscript(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Некорректная ссылка на YouTube");

  try {
    const { YoutubeTranscript } = await import("youtube-transcript");
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    if (segments && segments.length > 0) {
      const transcript = segments.map((s) => s.text).join(" ").trim();
      if (transcript.length > 50) return transcript.substring(0, 15000);
    }
  } catch (e) {
    console.log("youtube-transcript не удалось:", (e as Error).message);
  }

  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Cookie: "CONSENT=PENDING+999; SOCS=CAESEwgDEgk2ODE3MTAyNjQaAmVuIAEaBgiA_L-uBg",
      },
      cache: "no-store",
    });

    if (pageRes.ok) {
      const html = await pageRes.text();

      const captionsMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
      if (captionsMatch) {
        try {
          const captions = JSON.parse(captionsMatch[1]);
          const caption = captions[0];
          if (caption?.baseUrl) {
            const transcriptRes = await fetch(caption.baseUrl, { cache: "no-store" });
            if (transcriptRes.ok) {
              const xml = await transcriptRes.text();
              const transcript = xml
                .replace(/<[^>]+>/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\s+/g, " ")
                .trim();
              if (transcript.length > 50) return transcript.substring(0, 15000);
            }
          }
        } catch {
          /* ignore */
        }
      }

      const descMatch = html.match(/"shortDescription"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const titleMatch = html.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const description = descMatch
        ? descMatch[1]
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\")
        : "";
      const title = titleMatch ? titleMatch[1].replace(/\\"/g, '"') : "";

      if (description.length > 50)
        return `Видео: ${title}\n\nОписание:\n${description}`.substring(0, 15000);
      if (title.length > 5)
        return `YouTube видео: "${title}"\n\nТранскрипция и подробное описание недоступны. Извлечение знаний будет основано на названии видео.`;
    }
  } catch (e) {
    console.log("Ручной парсинг YouTube не удался:", (e as Error).message);
  }

  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { cache: "no-store" }
    );
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      const title = data.title || "Без названия";
      const author = data.author_name || "Неизвестный автор";
      return `YouTube видео: "${title}"\nАвтор канала: ${author}\n\nТранскрипция недоступна для данного видео. Пожалуйста, извлеки знания на основе названия видео и автора. Предположи тематику видео исходя из его названия и создай полезные артефакты знаний.`;
    }
  } catch (e) {
    console.log("oEmbed не удался:", (e as Error).message);
  }

  throw new Error(
    "Не удалось получить контент YouTube видео. Проверьте ссылку и попробуйте снова."
  );
}
