import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { isYooKassaWebhookIp, getClientIp } from "@/lib/yookassa-ip";

interface YooKassaNotification {
  type: "notification";
  event: string;
  object: {
    id: string;
    status: string;
    amount?: { value: string; currency: string };
    metadata?: { userId?: string; plan?: string };
  };
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.YOOKASSA_WEBHOOK_IP_CHECK !== "0") {
      const clientIp = getClientIp(request);
      if (!clientIp || !isYooKassaWebhookIp(clientIp)) {
        logger.warn("WEBHOOK-YOOKASSA", `Rejected: IP ${clientIp ?? "unknown"} not in whitelist`);
        return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
      }
    }

    const body = (await request.json()) as YooKassaNotification;
    if (body.type !== "notification" || body.event !== "payment.succeeded") {
      return NextResponse.json({ received: true });
    }

    const { metadata, id } = body.object;
    const userId = metadata?.userId;
    const plan = metadata?.plan;

    if (!userId || !plan) {
      console.warn("[webhooks/yookassa] Payment without userId/plan:", id);
      return NextResponse.json({ received: true });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.warn("[webhooks/yookassa] User not found:", userId);
      return NextResponse.json({ received: true });
    }

    const existing = await prisma.subscription.findUnique({ where: { userId } });
    const baseDate = existing?.premiumUntil && new Date(existing.premiumUntil) > new Date()
      ? new Date(existing.premiumUntil)
      : new Date();

    let premiumUntil: Date;
    if (plan === "yearly") {
      premiumUntil = new Date(baseDate);
      premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
    } else {
      premiumUntil = new Date(baseDate);
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);
    }

    const amount = body.object.amount;

    await prisma.$transaction([
      prisma.subscription.upsert({
        where: { userId },
        create: { userId, plan, premiumUntil },
        update: { plan, premiumUntil },
      }),
      prisma.paymentLog.upsert({
        where: { yookassaPaymentId: id },
        create: {
          yookassaPaymentId: id,
          userId,
          plan,
          status: "succeeded",
          amountValue: amount?.value ?? null,
          currency: amount?.currency ?? null,
        },
        update: {
          plan,
          status: "succeeded",
          amountValue: amount?.value ?? null,
          currency: amount?.currency ?? null,
        },
      }),
    ]);

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.critical("WEBHOOK-YOOKASSA", "Ошибка обработки webhook", err);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}
