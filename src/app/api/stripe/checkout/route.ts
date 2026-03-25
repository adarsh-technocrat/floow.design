import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe, PLAN_PRICE_IDS } from "@/lib/stripe";
import { PLAN_PRICES_CENTS } from "@/lib/plan-credits";
import { getCreditCapForUser } from "@/lib/plan-credits";
import { requireAuth } from "@/lib/auth";

const PLAN_ORDER = ["FREE", "LITE", "STARTER", "PRO", "TEAM"];

function calculateCreditBasedRefundCents(
  currentPlan: string,
  billingInterval: string | null,
  remainingCredits: number,
  seats: number,
): number {
  const planKey = currentPlan.toUpperCase();
  if (planKey === "FREE") return 0;

  const prices = PLAN_PRICES_CENTS[planKey];
  if (!prices) return 0;

  const interval = billingInterval === "yearly" ? "yearly" : "monthly";
  const pricePerSeatCents = prices[interval];
  const totalPaidCents =
    planKey === "TEAM" ? pricePerSeatCents * seats : pricePerSeatCents;

  const creditCap = getCreditCapForUser(planKey, billingInterval);
  const totalCreditCap = planKey === "TEAM" ? creditCap * seats : creditCap;

  if (totalCreditCap <= 0) return 0;

  const usedRatio = Math.max(0, Math.min(1, remainingCredits / totalCreditCap));
  return Math.round(totalPaidCents * usedRatio);
}

export async function POST(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const body = (await req.json()) as {
      plan?: string;
      interval?: "monthly" | "yearly";
      seats?: number;
    };

    const { plan, interval = "monthly" } = body;
    const seats = Math.max(1, Math.floor(body.seats ?? 1));

    if (!plan) {
      return NextResponse.json({ error: "plan is required" }, { status: 400 });
    }

    const planKey = plan.toUpperCase();
    const prices = PLAN_PRICE_IDS[planKey];
    if (!prices) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = prices[interval];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isTeamPlan = planKey === "TEAM";
    const quantity = isTeamPlan ? seats : 1;
    const currentPlanIdx = PLAN_ORDER.indexOf(user.plan);
    const targetPlanIdx = PLAN_ORDER.indexOf(planKey);
    const isUpgrade = targetPlanIdx > currentPlanIdx;

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.displayName || undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const metadata = {
      userId,
      plan: planKey,
      interval,
      seats: String(seats),
      previousPlan: user.plan,
      previousCredits: String(user.credits),
      isUpgrade: String(isUpgrade),
    };

    let creditAppliedCents = 0;

    if (user.stripeSubscriptionId && user.plan !== "FREE") {
      const refundCents = calculateCreditBasedRefundCents(
        user.plan,
        user.billingInterval,
        Math.max(0, user.credits),
        user.seats,
      );

      try {
        const existingSub = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId,
        );

        if (
          existingSub.status === "active" ||
          existingSub.status === "trialing"
        ) {
          await stripe.subscriptions.cancel(user.stripeSubscriptionId, {
            prorate: false,
          });
        }
      } catch {
        // Old subscription may already be cancelled
      }

      if (refundCents > 0) {
        await stripe.customers.update(customerId, {
          balance: -refundCents,
        });
        creditAppliedCents = refundCents;
      }

      await prisma.user.update({
        where: { id: userId },
        data: { stripeSubscriptionId: null },
      });
    }

    const creditMessage =
      creditAppliedCents > 0
        ? `$${(creditAppliedCents / 100).toFixed(2)} credit from unused ${user.plan} credits applied to this payment.`
        : user.plan !== "FREE"
          ? `Your ${user.plan} plan has been cancelled.`
          : "";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity }],
      success_url: `${req.nextUrl.origin}/dashboard?checkout=success&plan=${planKey}`,
      cancel_url: `${req.nextUrl.origin}/pricing?checkout=cancelled`,
      metadata: { ...metadata, creditAppliedCents: String(creditAppliedCents) },
      subscription_data: { metadata },
      allow_promotion_codes: true,
      ...(creditMessage
        ? { custom_text: { submit: { message: creditMessage } } }
        : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
