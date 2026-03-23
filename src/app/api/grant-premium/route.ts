import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { grantPremiumOneYear } from "@/lib/db/repositories/billing.repository";
import { findUserByEmailWithSubscription } from "@/lib/db/repositories/user.repository";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    let targetEmail = session.user.email.trim().toLowerCase();
    const body = await req.json().catch(() => ({}));
    const bodyEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (bodyEmail) targetEmail = bodyEmail;

    const user = await findUserByEmailWithSubscription(targetEmail);

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const premiumUntil = await grantPremiumOneYear(user.id);

    return NextResponse.json({
      success: true,
      premiumUntil: premiumUntil.toISOString(),
    });
  } catch (e) {
    console.error("Grant premium error:", e);
    return NextResponse.json({ error: "Ошибка при выдаче премиума" }, { status: 500 });
  }
}
