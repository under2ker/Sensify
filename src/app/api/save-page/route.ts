import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { requireSafeUrl } from "@/lib/validate";
import { UserError } from "@/lib/errors";
import { fetchWithRetry, URL_FETCH_TIMEOUT } from "@/lib/fetch-safe";
import { handleApiError } from "@/lib/api-error-handler";

/** POST — сохранить всю страницу по URL в удобном формате статьи (Markdown) */
export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  try {
    const body = await request.json().catch(() => ({}));
    const url = requireSafeUrl(body?.url, "url");

    const res = await fetchWithRetry(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      timeout: URL_FETCH_TIMEOUT,
      retries: 1,
    });

    if (!res.ok) {
      throw new UserError(
        `Не удалось загрузить страницу (код ${res.status}). Проверьте ссылку и доступность сайта.`,
        { statusCode: 400 }
      );
    }

    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new UserError("Не удалось извлечь основное содержимое страницы", { statusCode: 400 });
    }

    const turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
    turndown.addRule("preserveImages", {
      filter: "img",
      replacement: (_, node) => {
        const alt = (node as HTMLImageElement).getAttribute("alt") || "";
        const src = (node as HTMLImageElement).getAttribute("src") || "";
        if (src && !src.startsWith("data:")) {
          try {
            const absolute = new URL(src, url).href;
            return `![${alt}](${absolute})`;
          } catch {
            return alt || "";
          }
        }
        return alt || "";
      },
    });

    let markdown = turndown.turndown(article.content || "");
    // Убираем лишние пустые строки
    markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

    const title = article.title || new URL(url).hostname;
    const byline = article.byline ? `*${article.byline}*\n\n` : "";
    const header = `# ${title}\n\n${byline}Источник: [${url}](${url})\n\n---\n\n`;

    const fullContent = header + markdown;

    return NextResponse.json({
      title,
      content: fullContent,
      excerpt: article.excerpt || null,
    });
  } catch (e) {
    return handleApiError(e, "SAVE-PAGE", reqId);
  }
}
