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
