import { prisma } from "@/lib/prisma";

export async function createShareRecord(input: { data: string; expiresAt: Date | null }) {
  return prisma.share.create({ data: input });
}

export async function findShareById(id: string) {
  return prisma.share.findUnique({ where: { id } });
}
