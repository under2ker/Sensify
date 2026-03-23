import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        subscription: {
          select: { plan: true, premiumUntil: true },
        },
        _count: { select: { extractions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const pdfCounts = await prisma.extraction.groupBy({
      by: ["userId"],
      where: { sourceType: "pdf" },
      _count: { id: true },
    });
    const pdfByUser = new Map(pdfCounts.map((r) => [r.userId, r._count.id]));

    const usersWithPdfCount = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt.toISOString(),
      extractionCount: u._count.extractions,
      pdfCount: pdfByUser.get(u.id) ?? 0,
      subscription: u.subscription
        ? {
            plan: u.subscription.plan,
            premiumUntil: u.subscription.premiumUntil?.toISOString() ?? null,
          }
        : null,
    }));

    return NextResponse.json(usersWithPdfCount);
  } catch (e) {
    console.error("Admin users error:", e);
    return NextResponse.json({ error: "Ошибка загрузки пользователей" }, { status: 500 });
  }
}
