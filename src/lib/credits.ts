import { prisma } from "@/lib/db";
import { getCreditCapForUser, isOnPaidPlan } from "@/lib/plan-credits";

// Credits consumed per AI generation request
const CREDITS_PER_REQUEST: Record<string, number> = {
  chat: 30,
  design: 50,
};

export function getCreditCost(type: string): number {
  return CREDITS_PER_REQUEST[type] ?? 30;
}

/** Check if user has a paid plan and enough credits */
export async function checkCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      credits: true,
      billingInterval: true,
      creditsResetAt: true,
    },
  });

  if (!user) return { allowed: false, remaining: 0, total: 0, needsPlan: true };

  // No free plan — must be on a paid plan
  if (!isOnPaidPlan(user.plan)) {
    return { allowed: false, remaining: 0, total: 0, needsPlan: true };
  }

  const total = getCreditCapForUser(user.plan, user.billingInterval);

  // Auto-reset credits if reset date has passed
  if (user.creditsResetAt && new Date() > user.creditsResetAt) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: total,
        creditsResetAt: new Date(
          Date.now() +
            (user.billingInterval === "yearly"
              ? 365 * 24 * 60 * 60 * 1000
              : 30 * 24 * 60 * 60 * 1000),
        ),
      },
    });

    // Log the reset
    await prisma.creditLog.create({
      data: {
        userId,
        action: "reset",
        amount: total,
        balance: total,
        meta: `Plan renewal (${user.plan})`,
      },
    });

    return { allowed: true, remaining: total, total, needsPlan: false };
  }

  return {
    allowed: user.credits > 0,
    remaining: user.credits,
    total,
    needsPlan: false,
  };
}

/** Deduct credits after a successful AI request and log it */
export async function deductCredits(
  userId: string,
  type: string = "chat",
  projectId?: string,
): Promise<number> {
  const cost = getCreditCost(type);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: Math.min(cost, 999999) } },
    select: { credits: true },
  });

  const balance = Math.max(0, user.credits);

  // Ensure credits don't go negative
  if (user.credits < 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { credits: 0 },
    });
  }

  // Log the deduction
  await prisma.creditLog.create({
    data: {
      userId,
      action: type,
      amount: -cost,
      balance,
      projectId: projectId || null,
      meta: `AI ${type} generation`,
    },
  });

  return balance;
}
