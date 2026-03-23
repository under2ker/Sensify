import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findUserByEmailWithSubscription } from "@/lib/db/repositories/user.repository";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ hasPremium: false });
    }

    const user = await findUserByEmailWithSubscription(session.user.email);

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
