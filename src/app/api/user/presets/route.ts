import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPresetsRow, upsertUserPresets } from "@/lib/db/repositories/user-presets.repository";
import {
  parseStoredUserPresetsArray,
  userPresetsBodySchema,
} from "@/lib/user-presets-validation";
import { handleApiError } from "@/lib/api-error-handler";
import type { SavedUserPreset } from "@/types";

function parseStoredPresetsJson(raw: string): SavedUserPreset[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseStoredUserPresetsArray(parsed);
  } catch {
    return [];
  }
}

export async function GET() {
  const reqId = Math.random().toString(36).slice(2, 8);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ presets: [] as SavedUserPreset[] });
    }
    const row = await getUserPresetsRow(user.id);
    if (!row?.data) {
      return NextResponse.json({ presets: [] as SavedUserPreset[] });
    }
    const presets = parseStoredPresetsJson(row.data);
    return NextResponse.json({ presets, updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    return handleApiError(e, "USER_PRESETS_GET", reqId);
  }
}

export async function PUT(request: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const parsed = userPresetsBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные пресетов" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }
    const row = await upsertUserPresets(user.id, parsed.data.presets);
    return NextResponse.json({ ok: true, updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    return handleApiError(e, "USER_PRESETS_PUT", reqId);
  }
}
