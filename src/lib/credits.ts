import { prisma } from "@/lib/db";
import { getCreditCapForUser, isOnPaidPlan } from "@/lib/plan-credits";
import { resolveCreditsSource } from "@/lib/team-auth";

const CREDITS_PER_REQUEST: Record<string, number> = {
  chat: 30,
  design: 50,
};

export function getCreditCost(type: string): number {
  return CREDITS_PER_REQUEST[type] ?? 30;
}

export async function checkCredits(userId: string, projectId?: string) {
  const source = await resolveCreditsSource(userId, projectId);

  if (source.type === "team") {
    const team = await prisma.team.findUnique({
      where: { id: source.id },
      select: { credits: true, seats: true, billingInterval: true, creditsResetAt: true },
    });

    if (!team) return { allowed: false, remaining: 0, total: 0, needsPlan: true };

    if (team.creditsResetAt && new Date() > team.creditsResetAt) {
      const baseCap = getCreditCapForUser("TEAM", team.billingInterval);
      const totalCredits = baseCap * (team.seats ?? 1);

      await prisma.team.update({
        where: { id: source.id },
        data: {
          credits: totalCredits,
          creditsResetAt: new Date(
            Date.now() +
              (team.billingInterval === "yearly"
                ? 365 * 24 * 60 * 60 * 1000
                : 30 * 24 * 60 * 60 * 1000),
          ),
        },
      });

      await prisma.teamCreditLog.create({
        data: {
          teamId: source.id,
          userId,
          action: "reset",
          amount: totalCredits,
          balance: totalCredits,
          meta: "Team credit renewal",
        },
      });

      return { allowed: true, remaining: totalCredits, total: totalCredits, needsPlan: false };
    }

    const baseCap = getCreditCapForUser("TEAM", team.billingInterval);
    const total = baseCap * (team.seats ?? 1);
    return {
      allowed: team.credits > 0,
      remaining: team.credits,
      total,
      needsPlan: false,
    };
  }

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

  if (!isOnPaidPlan(user.plan)) {
    return { allowed: false, remaining: 0, total: 0, needsPlan: true };
  }

  const total = getCreditCapForUser(user.plan, user.billingInterval);

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

export async function deductCredits(
  userId: string,
  type: string = "chat",
  projectId?: string,
): Promise<number> {
  const cost = getCreditCost(type);
  const source = await resolveCreditsSource(userId, projectId);

  if (source.type === "team") {
    const team = await prisma.team.update({
      where: { id: source.id },
      data: { credits: { decrement: Math.min(cost, 999999) } },
      select: { credits: true },
    });

    const balance = Math.max(0, team.credits);
    if (team.credits < 0) {
      await prisma.team.update({
        where: { id: source.id },
        data: { credits: 0 },
      });
    }

    await prisma.teamCreditLog.create({
      data: {
        teamId: source.id,
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

  const user = await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: Math.min(cost, 999999) } },
    select: { credits: true },
  });

  const balance = Math.max(0, user.credits);

  if (user.credits < 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { credits: 0 },
    });
  }

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
