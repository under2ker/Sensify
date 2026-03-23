import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error-handler";
import { ValidationError } from "@/lib/errors";
import { parseNotionPageId } from "@/lib/notion/parse-page-id";
import {
  buildNotionBlocksFromResult,
  buildNotionBlocksFromSavedPage,
} from "@/lib/notion/build-blocks";
import type { ExtractionResult } from "@/types";

const NOTION_VERSION = "2022-06-28";
const TITLE_MAX = 1990;

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function titlePropertyValue(title: string) {
  const t = title.trim().slice(0, TITLE_MAX) || "Sensify";
  return {
    title: [{ type: "text", text: { content: t } }],
  };
}

export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });
    const until = user?.subscription?.premiumUntil;
    const hasPremium = !!until && new Date(until) > new Date();
    if (!hasPremium) {
      return NextResponse.json(
        { error: "Отправка в Notion доступна с премиум-подпиской" },
        { status: 402 }
      );
    }

    const body = (await request.json()) as {
      notionToken?: string;
      parentPageId?: string;
      extraTags?: string[] | string;
      result?: ExtractionResult;
      savedPage?: { title: string; content: string; source: string };
    };

    const notionToken = String(body.notionToken ?? "").trim();
    const parentRaw = String(body.parentPageId ?? "").trim();
    let extraTags: string[] = [];
    if (Array.isArray(body.extraTags)) {
      extraTags = body.extraTags.map(String);
    } else if (typeof body.extraTags === "string") {
      extraTags = body.extraTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    if (!notionToken.startsWith("secret_")) {
      throw new ValidationError(
        "Укажите корректный Internal Integration Secret из Notion (начинается с secret_)."
      );
    }

    const parentPageId = parseNotionPageId(parentRaw);

    const saved = body.savedPage;
    const result = body.result;
    const hasSaved =
      saved &&
      typeof saved.title === "string" &&
      typeof saved.content === "string";
    const hasResult = result && typeof result.title === "string";

    if (!hasSaved && !hasResult) {
      throw new ValidationError("Нет данных для отправки (результат или сохранённая страница).");
    }

    const pageTitle = hasSaved
      ? `Sensify: ${saved!.title}`.slice(0, TITLE_MAX)
      : `Sensify: ${result!.title}`.slice(0, TITLE_MAX);

    const blocks = hasSaved
      ? buildNotionBlocksFromSavedPage(saved!)
      : buildNotionBlocksFromResult(result!, extraTags);

    const createRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { page_id: parentPageId },
        properties: {
          title: titlePropertyValue(pageTitle),
        },
      }),
    });

    if (!createRes.ok) {
      const err = (await createRes.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new ValidationError(
        err.message || `Notion отклонил создание страницы (${createRes.status}). Проверьте, что интеграции открыт доступ к родительской странице.`
      );
    }

    const created = (await createRes.json()) as { id: string; url?: string };
    let partial = false;
    let partialError: string | undefined;

    const batches = chunk(blocks, 100);
    for (const batch of batches) {
      if (batch.length === 0) continue;
      const patch = await fetch(
        `https://api.notion.com/v1/blocks/${created.id}/children`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${notionToken}`,
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ children: batch }),
        }
      );
      if (!patch.ok) {
        const err = (await patch.json().catch(() => ({}))) as {
          message?: string;
        };
        partial = true;
        partialError =
          err.message || `Не удалось добавить часть блоков (${patch.status})`;
        break;
      }
    }

    return NextResponse.json({
      ok: true,
      pageId: created.id,
      url: created.url,
      partial,
      partialError,
    });
  } catch (e) {
    return handleApiError(e, "NOTION-PUSH", reqId);
  }
}
