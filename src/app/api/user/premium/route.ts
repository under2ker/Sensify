import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ hasPremium: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });

    if (!user?.subscription) {
      return NextResponse.json({ hasPremium: false });
    }

    const until = user.subscription.premiumUntil;
    const hasPremium = !!until && new Date(until) > new Date();

    return NextResponse.json({ hasPremium });
  } catch {
    return NextResponse.json({ hasPremium: false });
  }
}
