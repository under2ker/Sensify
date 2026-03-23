import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireString, optionalString } from "@/lib/validate";
import { handleApiError } from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  try {
    const body = await request.json().catch(() => ({}));
    const title = requireString(body?.title, "title", 500);
    const summary = requireString(body?.summary, "summary", 50000);
    const source = optionalString(body?.source, "source", 2048) ?? "";
    const sourceType = (body?.sourceType as string) || "text";
    const keyIdeas = Array.isArray(body?.keyIdeas) ? body.keyIdeas : [];
    const flashcards = Array.isArray(body?.flashcards) ? body.flashcards : [];
    const structuredNotes = optionalString(body?.structuredNotes, "structuredNotes", 100000) ?? "";
    const tags = Array.isArray(body?.tags) ? body.tags : [];
    const language = optionalString(body?.language, "language", 10) ?? "ru";
    const imageUrl = body?.imageUrl ?? null;
    const id = body?.id ?? `share-${Date.now()}`;

    const rawLinks = Array.isArray(body?.extractedLinks) ? body.extractedLinks : [];
    const extractedLinks = rawLinks
      .filter((x: unknown) => x !== null && typeof x === "object")
      .map((x: { href?: unknown; label?: unknown; description?: unknown }) => {
        const href = String(x.href ?? "").trim().slice(0, 4096);
        const label = String(x.label ?? "").trim().slice(0, 500);
        const desc = String(x.description ?? "").trim().slice(0, 800);
        return {
          href,
          label,
          ...(desc ? { description: desc } : {}),
        };
      })
      .filter((x: { href: string; label: string }) => /^https?:\/\//i.test(x.href))
      .slice(0, 120);

    const rawCode = Array.isArray(body?.codeSnippets) ? body.codeSnippets : [];
    const codeSnippets = rawCode
      .filter((x: unknown) => x !== null && typeof x === "object")
      .map((x: { title?: unknown; language?: unknown; code?: unknown; explanation?: unknown }) => {
        const lang = String(x.language ?? "").trim().slice(0, 40);
        return {
          title: String(x.title ?? "").trim().slice(0, 220) || "Код",
          ...(lang ? { language: lang } : {}),
          code: String(x.code ?? "").slice(0, 100_000),
          explanation: String(x.explanation ?? "").trim().slice(0, 15_000),
        };
      })
      .filter(
        (x: { code: string; explanation: string }) =>
          x.code.length > 0 || x.explanation.length > 0
      )
      .slice(0, 24);

    const data = JSON.stringify({
      id,
      title,
      source,
      sourceType,
      createdAt: new Date().toISOString(),
      summary,
      keyIdeas,
      flashcards,
      structuredNotes,
      tags,
      language,
      imageUrl,
      extractedLinks,
      codeSnippets,
    });

    const share = await prisma.share.create({
      data: { data },
    });

    return NextResponse.json({ id: share.id });
  } catch (e) {
    return handleApiError(e, "SHARE", reqId);
  }
}
