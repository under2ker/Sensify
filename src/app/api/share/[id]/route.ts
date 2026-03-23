import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const share = await prisma.share.findUnique({
      where: { id },
    });

    if (!share) {
      return NextResponse.json({ error: "Ссылка не найдена или истекла" }, { status: 404 });
    }

    let result: unknown;
    try {
      result = JSON.parse(share.data);
    } catch {
      console.error("Share [id]: повреждённые данные, JSON.parse failed", { id: share.id });
      return NextResponse.json(
        { error: "Данные повреждены или устарели" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Share get error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки" },
      { status: 500 }
    );
  }
}
