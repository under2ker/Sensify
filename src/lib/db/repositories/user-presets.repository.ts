import { prisma } from "@/lib/prisma";
import type { SavedUserPreset } from "@/types";

export async function getUserPresetsRow(userId: string) {
  return prisma.userPresets.findUnique({ where: { userId } });
}

export async function upsertUserPresets(userId: string, presets: SavedUserPreset[]) {
  const data = JSON.stringify(presets);
  return prisma.userPresets.upsert({
    where: { userId },
    create: { userId, data },
    update: { data },
  });
}
