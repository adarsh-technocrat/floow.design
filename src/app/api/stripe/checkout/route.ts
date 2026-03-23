import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe, PLAN_PRICE_IDS, PLAN_CREDITS } from "@/lib/stripe";

const PLAN_ORDER = ["FREE", "LITE", "STARTER", "PRO", "TEAM"];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      userId?: string;
      plan?: string;
      interval?: "monthly" | "yearly";
      seats?: number;
    };

    const { userId, plan, interval = "monthly" } = body;
    const seats = Math.max(1, Math.floor(body.seats ?? 1));

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "userId and plan are required" },
        { status: 400 },
      );
    }

    const planKey = plan.toUpperCase();
    const prices = PLAN_PRICE_IDS[planKey];
    if (!prices) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = prices[interval];
    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid interval" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isTeamPlan = planKey === "TEAM";
    const quantity = isTeamPlan ? seats : 1;
    const baseCredits = PLAN_CREDITS[planKey]?.[interval] || 0;
    const totalCredits = isTeamPlan ? baseCredits * seats : baseCredits;

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

    if (user.stripeSubscriptionId) {
      const currentPlanIdx = PLAN_ORDER.indexOf(user.plan);
      const targetPlanIdx = PLAN_ORDER.indexOf(planKey);
      const isUpgrade = targetPlanIdx > currentPlanIdx;
      const isSeatChange = planKey === user.plan && isTeamPlan && seats !== user.seats;

      const subscription = await stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
      );

      if (subscription.status === "active" || subscription.status === "trialing") {
        const currentItem = subscription.items.data[0];

        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          items: [
            {
              id: currentItem.id,
              price: priceId,
              quantity,
            },
          ],
          proration_behavior: "create_prorations",
          metadata: { userId, plan: planKey, interval, seats: String(seats) },
        });

        const currentCredits = Math.max(0, user.credits);
        let finalCredits: number;

        if (isSeatChange) {
          const creditPerSeat = baseCredits;
          const addedSeats = seats - user.seats;
          finalCredits = currentCredits + (addedSeats > 0 ? addedSeats * creditPerSeat : 0);
        } else if (isUpgrade) {
          finalCredits = currentCredits + totalCredits;
        } else {
          finalCredits = totalCredits;
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: planKey as "FREE" | "LITE" | "STARTER" | "PRO" | "TEAM",
            billingInterval: interval,
            seats: isTeamPlan ? seats : 1,
            credits: finalCredits,
            creditsResetAt: new Date(
              Date.now() +
                (interval === "yearly"
                  ? 365 * 24 * 60 * 60 * 1000
                  : 30 * 24 * 60 * 60 * 1000),
            ),
          },
        });

        await prisma.creditLog.create({
          data: {
            userId,
            action: isSeatChange ? "seat_change" : "plan_change",
            amount: finalCredits - currentCredits,
            balance: finalCredits,
            meta: JSON.stringify({
              from: user.plan,
              to: planKey,
              interval,
              seats,
              previousSeats: user.seats,
              prorated: true,
            }),
          },
        });

        return NextResponse.json({
          url: `${req.nextUrl.origin}/dashboard?checkout=success&upgraded=true`,
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity }],
      success_url: `${req.nextUrl.origin}/dashboard?checkout=success`,
      cancel_url: `${req.nextUrl.origin}/pricing?checkout=cancelled`,
      metadata: { userId, plan: planKey, interval, seats: String(seats) },
      subscription_data: {
        metadata: { userId, plan: planKey, interval, seats: String(seats) },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
