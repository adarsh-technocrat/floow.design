import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCreditCapForUser } from "@/lib/plan-credits";
import { requireAuth } from "@/lib/auth";

// GET /api/user/plan — get authenticated user's current plan and credits
export async function GET(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        billingInterval: true,
        seats: true,
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
      seats: user.seats,
      credits: user.credits,
      creditCap:
        user.plan === "TEAM" ? creditCap * (user.seats ?? 1) : creditCap,
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
