export const PLAN_CREDITS: Record<string, { monthly: number; yearly: number }> =
  {
    LITE: { monthly: 1000, yearly: 12000 },
    STARTER: { monthly: 3000, yearly: 36000 },
    PRO: { monthly: 20000, yearly: 240000 },
    TEAM: { monthly: 30000, yearly: 360000 },
  };

export function isOnPaidPlan(plan: string): boolean {
  const normalized = plan?.toUpperCase() ?? "FREE";
  return normalized !== "FREE" && normalized in PLAN_CREDITS;
}

export function getCreditCapForUser(
  plan: string,
  billingInterval: string | null | undefined,
): number {
  const normalized = plan?.toUpperCase() ?? "FREE";
  if (normalized === "FREE") return 0;
  const interval = billingInterval === "yearly" ? "yearly" : "monthly";
  const row = PLAN_CREDITS[normalized];
  if (!row) return 0;
  return row[interval];
}
