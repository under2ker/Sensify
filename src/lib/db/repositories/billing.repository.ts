import { prisma } from "@/lib/prisma";

const DEFAULT_PAYMENT_LOG_LIMIT = 80;

/** ЮKassa `payment.succeeded`: подписка + идемпотентная запись в журнале. */
export async function applyYooKassaPaymentSuccess(params: {
  userId: string;
  plan: string;
  premiumUntil: Date;
  yookassaPaymentId: string;
  amountValue?: string | null;
  currency?: string | null;
}) {
  const { userId, plan, premiumUntil, yookassaPaymentId, amountValue, currency } = params;
  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: { userId, plan, premiumUntil },
      update: { plan, premiumUntil },
    }),
    prisma.paymentLog.upsert({
      where: { yookassaPaymentId },
      create: {
        yookassaPaymentId,
        userId,
        plan,
        status: "succeeded",
        amountValue: amountValue ?? null,
        currency: currency ?? null,
      },
      update: {
        plan,
        status: "succeeded",
        amountValue: amountValue ?? null,
        currency: currency ?? null,
      },
    }),
  ]);
}

export async function grantPremiumOneYear(userId: string) {
  const premiumUntil = new Date();
  premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan: "premium", premiumUntil },
    update: { plan: "premium", premiumUntil },
  });
  return premiumUntil;
}

export async function revokePremiumSubscription(userId: string) {
  await prisma.subscription.update({
    where: { userId },
    data: { plan: "free", premiumUntil: null },
  });
}

export async function findSubscriptionByUserId(userId: string) {
  return prisma.subscription.findUnique({ where: { userId } });
}

export async function listRecentPaymentLogsWithUserEmail(limit = DEFAULT_PAYMENT_LOG_LIMIT) {
  return prisma.paymentLog.findMany({
    take: limit,
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
}
