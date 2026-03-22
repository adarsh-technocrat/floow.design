import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe, PLAN_PRICE_IDS } from "@/lib/stripe";

// POST /api/stripe/checkout — create a Stripe Checkout session
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      userId?: string;
      plan?: string;
      interval?: "monthly" | "yearly";
    };

    const { userId, plan, interval = "monthly" } = body;

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

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/dashboard?checkout=success`,
      cancel_url: `${req.nextUrl.origin}/pricing?checkout=cancelled`,
      metadata: { userId, plan: planKey, interval },
      subscription_data: {
        metadata: { userId, plan: planKey, interval },
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
