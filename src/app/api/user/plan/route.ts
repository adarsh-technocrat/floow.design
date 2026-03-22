import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCreditCapForUser } from "@/lib/plan-credits";

// GET /api/user/plan?userId=X — get user's current plan and credits
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        billingInterval: true,
        credits: true,
        creditsResetAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const creditCap = getCreditCapForUser(user.plan, user.billingInterval);

    return NextResponse.json({
      plan: user.plan,
      billingInterval: user.billingInterval,
      credits: user.credits,
      creditCap,
      creditsResetAt: user.creditsResetAt?.toISOString() || null,
      hasStripeAccount: !!user.stripeCustomerId,
      hasSubscription: !!user.stripeSubscriptionId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
