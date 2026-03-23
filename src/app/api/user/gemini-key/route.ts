import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openUserApiKey, sealUserApiKey } from "@/lib/user-api-keys-crypto";

/** GET — вернуть сохранённый API-ключ Gemini текущего пользователя */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ geminiApiKey: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { geminiApiKey: true },
    });

    return NextResponse.json({
      geminiApiKey: openUserApiKey(user?.geminiApiKey ?? null),
    });
  } catch {
    return NextResponse.json({ error: "Ошибка загрузки ключа" }, { status: 500 });
  }
}

/** PUT — сохранить API-ключ Gemini в аккаунт */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const geminiApiKey = typeof body.geminiApiKey === "string" ? body.geminiApiKey.trim() : "";

    if (!geminiApiKey) {
      return NextResponse.json({ error: "Укажите API-ключ" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { geminiApiKey: sealUserApiKey(geminiApiKey) },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PUT /api/user/gemini-key:", e);
    const msg = e instanceof Error ? e.message : "Ошибка сохранения ключа";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
