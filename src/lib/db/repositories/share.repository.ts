import { prisma } from "@/lib/prisma";

export async function createShareRecord(input: {
  data: string;
  expiresAt: Date | null;
  userId?: string | null;
}) {
  return prisma.share.create({
    data: {
      data: input.data,
      expiresAt: input.expiresAt,
      ...(input.userId ? { userId: input.userId } : {}),
    },
  });
}

export async function findShareById(id: string) {
  return prisma.share.findUnique({ where: { id } });
}

export type ShareListSummary = {
  id: string;
  title: string;
  createdAt: string;
  expiresAt: string | null;
};

export async function listShareSummariesForUser(userId: string, take = 50): Promise<ShareListSummary[]> {
  const rows = await prisma.share.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, data: true, createdAt: true, expiresAt: true },
  });
  return rows.map((r) => {
    let title = "Без названия";
    try {
      const j = JSON.parse(r.data) as { title?: string };
      if (typeof j.title === "string" && j.title.trim()) title = j.title.trim().slice(0, 200);
    } catch {
      /* ignore */
    }
    return {
      id: r.id,
      title,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    };
  });
}
