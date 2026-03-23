import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openUserApiKey, sealUserApiKey } from "@/lib/user-api-keys-crypto";

/** GET — вернуть сохранённый API-ключ Groq текущего пользователя */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ groqApiKey: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { groqApiKey: true },
    });

    return NextResponse.json({
      groqApiKey: openUserApiKey(user?.groqApiKey ?? null),
    });
  } catch {
    return NextResponse.json({ error: "Ошибка загрузки ключа" }, { status: 500 });
  }
}

/** PUT — сохранить API-ключ Groq в аккаунт */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const groqApiKey = typeof body.groqApiKey === "string" ? body.groqApiKey.trim() : "";

    if (!groqApiKey) {
      return NextResponse.json({ error: "Укажите API-ключ" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { groqApiKey: sealUserApiKey(groqApiKey) },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PUT /api/user/groq-key:", e);
    let msg = e instanceof Error ? e.message : "Ошибка сохранения ключа";
    if (msg.includes("Unknown arg") || msg.includes("groqApiKey")) {
      msg = "Prisma Client устарел. Остановите dev-сервер, выполните: npx prisma generate, затем запустите снова.";
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
