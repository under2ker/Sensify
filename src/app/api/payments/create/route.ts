import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { AuthError, ValidationError, ExternalServiceError } from "@/lib/errors";
import { fetchWithRetry } from "@/lib/fetch-safe";
import { handleApiError } from "@/lib/api-error-handler";

const PLANS = {
  monthly: { amount: 299, description: "Премиум — 1 месяц" },
  yearly: { amount: 2490, description: "Премиум — 1 год (экономия 30%)" },
} as const;

export async function POST(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new AuthError("Требуется авторизация");
    }

    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    if (!shopId || !secretKey) {
      throw new ExternalServiceError("Платежи не настроены. Обратитесь к администратору.", { statusCode: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = body?.plan as keyof typeof PLANS;
    if (!plan || !PLANS[plan]) {
      throw new ValidationError("Некорректный план (monthly или yearly)");
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      throw new ValidationError("Пользователь не найден", { statusCode: 404 });
    }

    const { amount, description } = PLANS[plan];
    const returnUrl = `${request.nextUrl.origin}/premium?success=1`;
    const idempotenceKey = randomUUID();

    const yooRes = await fetchWithRetry("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: { value: amount.toFixed(2), currency: "RUB" },
        description,
        capture: true,
        confirmation: { type: "redirect", return_url: returnUrl },
        metadata: { userId: user.id, plan },
      }),
      timeout: 15000,
      retries: 1,
    });

    const data = (await yooRes.json()) as {
      id?: string;
      confirmation?: { confirmation_url?: string };
      error?: { code?: string; description?: string };
    };

    if (!yooRes.ok) {
      throw new ExternalServiceError(data.error?.description || "Ошибка при создании платежа");
    }

    const confirmationUrl = data.confirmation?.confirmation_url;
    if (!confirmationUrl) {
      throw new ExternalServiceError("ЮKassa не вернула ссылку на оплату");
    }

    return NextResponse.json({
      paymentId: data.id,
      confirmationUrl,
    });
  } catch (e) {
    return handleApiError(e, "PAYMENTS", reqId);
  }
}
