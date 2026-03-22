import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe, PLAN_CREDITS } from "@/lib/stripe";

// Use string literals instead of importing PlanType enum (Turbopack compat)
type PlanString = "FREE" | "LITE" | "STARTER" | "PRO" | "TEAM";
const VALID_PLANS = new Set<string>(["FREE", "LITE", "STARTER", "PRO", "TEAM"]);
function toPlan(s: string | undefined): PlanString {
  const upper = s?.toUpperCase() ?? "FREE";
  return VALID_PLANS.has(upper) ? (upper as PlanString) : "FREE";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown"}`,
      },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const interval = session.metadata?.interval as
          | "monthly"
          | "yearly"
          | undefined;

        if (userId && plan && session.subscription) {
          const planEnum = toPlan(plan);
          const credits =
            PLAN_CREDITS[plan]?.[interval || "monthly"] || 0;

          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: planEnum,
              billingInterval: interval || "monthly",
              stripeSubscriptionId: session.subscription as string,
              credits,
              creditsResetAt: new Date(
                Date.now() +
                  (interval === "yearly"
                    ? 365 * 24 * 60 * 60 * 1000
                    : 30 * 24 * 60 * 60 * 1000),
              ),
            },
          });
        }
        break;
      }

      case "invoice.paid": {
        // Recurring payment — reset credits
        const invoice = event.data.object;
        const subField = (invoice as unknown as Record<string, unknown>).subscription;
        const subscriptionId =
          typeof subField === "string" ? subField : String(subField ?? "");

        if (subscriptionId) {
          const user = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });

          if (user && user.plan !== "FREE" as PlanString) {
            const credits =
              PLAN_CREDITS[user.plan]?.[
                (user.billingInterval as "monthly" | "yearly") || "monthly"
              ] || 0;

            await prisma.user.update({
              where: { id: user.id },
              data: {
                credits,
                creditsResetAt: new Date(
                  Date.now() +
                    (user.billingInterval === "yearly"
                      ? 365 * 24 * 60 * 60 * 1000
                      : 30 * 24 * 60 * 60 * 1000),
                ),
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Subscription cancelled — downgrade to free
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "FREE" as PlanString,
              billingInterval: null,
              stripeSubscriptionId: null,
              credits: 0,
              creditsResetAt: null,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        // Plan change
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const plan = subscription.metadata?.plan;
        const interval = subscription.metadata?.interval as
          | "monthly"
          | "yearly"
          | undefined;

        if (userId && plan) {
          const planEnum = toPlan(plan);
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: planEnum,
              billingInterval: interval || "monthly",
            },
          });
        }
        break;
      }
    }
  } catch (e) {
    console.error("Webhook handler error:", e);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
