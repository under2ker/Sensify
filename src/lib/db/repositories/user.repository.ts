import { prisma } from "@/lib/prisma";

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByEmailWithSubscription(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });
}

/** Минимальный запрос для метаданных платежа ЮKassa */
export async function findUserIdByEmail(email: string): Promise<{ id: string } | null> {
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}
