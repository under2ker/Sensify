import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        extractions: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const [totalRequests, fileCount] = await Promise.all([
      prisma.extraction.count({ where: { userId: user.id } }),
      prisma.extraction.count({ where: { userId: user.id, sourceType: "pdf" } }),
    ]);

    return NextResponse.json({
      totalRequests,
      fileCount,
      history: user.extractions.map((e) => ({
        id: e.id,
        title: e.title,
        source: e.source,
        sourceType: e.sourceType,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("User stats error:", e);
    return NextResponse.json({ error: "Ошибка загрузки статистики" }, { status: 500 });
  }
}
