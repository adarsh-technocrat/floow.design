import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe, PLAN_CREDITS } from "@/lib/stripe";
import { sendPlanUpgradeEmail } from "@/lib/email/send";

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
        const seats = Math.max(1, parseInt(session.metadata?.seats || "1", 10));
        const previousSubscriptionId = session.metadata?.previousSubscriptionId;
        const previousCredits = parseInt(session.metadata?.previousCredits || "0", 10);
        const isUpgrade = session.metadata?.isUpgrade === "true";
        const previousPlan = session.metadata?.previousPlan;

        if (userId && plan && session.subscription) {
          const planEnum = toPlan(plan);
          const isTeam = planEnum === "TEAM";
          const baseCredits = PLAN_CREDITS[plan]?.[interval || "monthly"] || 0;
          const newPlanCredits = isTeam ? baseCredits * seats : baseCredits;

          const finalCredits = isUpgrade
            ? Math.max(0, previousCredits) + newPlanCredits
            : newPlanCredits;

          if (previousSubscriptionId) {
            try {
              await stripe.subscriptions.cancel(previousSubscriptionId, {
                prorate: true,
              });
            } catch {
              // Old subscription may already be cancelled
            }
          }

          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: planEnum,
              billingInterval: interval || "monthly",
              seats: isTeam ? seats : 1,
              stripeSubscriptionId: session.subscription as string,
              credits: finalCredits,
              creditsResetAt: new Date(
                Date.now() +
                  (interval === "yearly"
                    ? 365 * 24 * 60 * 60 * 1000
                    : 30 * 24 * 60 * 60 * 1000),
              ),
            },
          });

          if (previousPlan && previousPlan !== plan) {
            await prisma.creditLog.create({
              data: {
                userId,
                action: "plan_change",
                amount: finalCredits - previousCredits,
                balance: finalCredits,
                meta: JSON.stringify({
                  from: previousPlan,
                  to: planEnum,
                  interval,
                  seats,
                  isUpgrade,
                  previousCredits,
                }),
              },
            });
          }

          const upgradedUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, displayName: true },
          });
          if (upgradedUser?.email) {
            sendPlanUpgradeEmail(
              upgradedUser.email,
              upgradedUser.displayName || "",
              planEnum,
              finalCredits,
            ).catch(() => {});
          }
        }
        break;
      }

      case "invoice.paid": {
        // Recurring payment — reset credits
        const invoice = event.data.object;
        const subField = (invoice as unknown as Record<string, unknown>)
          .subscription;
        const subscriptionId =
          typeof subField === "string" ? subField : String(subField ?? "");

        if (subscriptionId) {
          const user = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });

          if (user && user.plan !== ("FREE" as PlanString)) {
            const baseCredits =
              PLAN_CREDITS[user.plan]?.[
                (user.billingInterval as "monthly" | "yearly") || "monthly"
              ] || 0;
            const totalCredits = user.plan === "TEAM"
              ? baseCredits * (user.seats ?? 1)
              : baseCredits;

            await prisma.user.update({
              where: { id: user.id },
              data: {
                credits: totalCredits,
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
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const plan = subscription.metadata?.plan;
        const interval = subscription.metadata?.interval as
          | "monthly"
          | "yearly"
          | undefined;

        if (userId && plan) {
          const planEnum = toPlan(plan);
          const billingInterval = interval || "monthly";

          const user = await prisma.user.findUnique({
            where: { id: userId },
          });

          if (user && user.plan !== planEnum) {
            const newCredits =
              PLAN_CREDITS[plan]?.[billingInterval] || 0;
            const currentCredits = Math.max(0, user.credits);
            const PLAN_ORDER = ["FREE", "LITE", "STARTER", "PRO", "TEAM"];
            const isUpgrade =
              PLAN_ORDER.indexOf(planEnum) > PLAN_ORDER.indexOf(user.plan);
            const finalCredits = isUpgrade
              ? currentCredits + newCredits
              : newCredits;

            await prisma.user.update({
              where: { id: userId },
              data: {
                plan: planEnum,
                billingInterval,
                credits: finalCredits,
                creditsResetAt: new Date(
                  Date.now() +
                    (billingInterval === "yearly"
                      ? 365 * 24 * 60 * 60 * 1000
                      : 30 * 24 * 60 * 60 * 1000),
                ),
              },
            });

            await prisma.creditLog.create({
              data: {
                userId,
                action: "plan_change",
                amount: finalCredits - currentCredits,
                balance: finalCredits,
                meta: JSON.stringify({
                  from: user.plan,
                  to: planEnum,
                  interval: billingInterval,
                  prorated: true,
                }),
              },
            });
          } else {
            await prisma.user.update({
              where: { id: userId },
              data: {
                plan: planEnum,
                billingInterval,
              },
            });
          }
        }
        break;
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
