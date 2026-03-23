import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { listRecentPaymentLogsWithUserEmail } from "@/lib/db/repositories/billing.repository";

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

    const rows = await listRecentPaymentLogsWithUserEmail(LIMIT);

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
