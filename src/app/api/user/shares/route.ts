import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listShareSummariesForUser } from "@/lib/db/repositories/share.repository";
import { handleApiError } from "@/lib/api-error-handler";

/**
 * Список публичных ссылок, созданных авторизованным пользователем (для вкладки «Ссылки» в истории).
 */
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
      return NextResponse.json({ items: [] });
    }
    const items = await listShareSummariesForUser(user.id);
    return NextResponse.json({ items });
  } catch (e) {
    return handleApiError(e, "USER_SHARES", reqId);
  }
}
