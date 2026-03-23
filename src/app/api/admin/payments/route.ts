import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const LIMIT = 80;

/** GET — журнал успешных оплат ЮKassa (только админ) */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const rows = await prisma.paymentLog.findMany({
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        yookassaPaymentId: true,
        plan: true,
        amountValue: true,
        currency: true,
        status: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    });

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        yookassaPaymentId: r.yookassaPaymentId,
        email: r.user.email,
        plan: r.plan,
        amountValue: r.amountValue,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (e) {
    console.error("Admin payments error:", e);
    return NextResponse.json({ error: "Ошибка загрузки платежей" }, { status: 500 });
  }
}
