import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Укажите email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }
    if (!user.subscription) {
      return NextResponse.json({ error: "У пользователя нет подписки" }, { status: 400 });
    }

    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan: "free",
        premiumUntil: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Revoke premium error:", e);
    return NextResponse.json({ error: "Ошибка при снятии премиума" }, { status: 500 });
  }
}
