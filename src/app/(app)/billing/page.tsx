"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface PlanInfo {
  plan: string;
  billingInterval: string | null;
  credits: number;
  creditCap: number;
  creditsResetAt: string | null;
  hasStripeAccount: boolean;
  hasSubscription: boolean;
}

interface DailyUsage {
  date: string;
  count: number;
}

const planLabels: Record<string, string> = {
  FREE: "Free",
  LITE: "Lite",
  STARTER: "Starter",
  PRO: "Pro",
  TEAM: "Team",
};


const barChartConfig: ChartConfig = {
  credits: {
    label: "Credits Used",
    color: "#8b5cf6",
  },
};

function UsageBarChart({ data }: { data: DailyUsage[] }) {
  // Aggregate into weekly buckets for a cleaner chart
  const weeklyData = useMemo(() => {
    const weeks: Array<{ week: string; credits: number }> = [];
    let bucket: { start: string; total: number } | null = null;
    let dayCount = 0;

    for (const day of data) {
      if (!bucket) {
        bucket = { start: day.date, total: day.count };
        dayCount = 1;
      } else {
        bucket.total += day.count;
        dayCount++;
      }

      if (dayCount === 7) {
        const startDate = new Date(bucket.start);
        const label = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        weeks.push({ week: label, credits: bucket.total });
        bucket = null;
        dayCount = 0;
      }
    }

    // Push remaining partial week
    if (bucket) {
      const startDate = new Date(bucket.start);
      const label = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      weeks.push({ week: label, credits: bucket.total });
    }

    return weeks;
  }, [data]);

  const totalCredits = useMemo(
    () => data.reduce((sum, d) => sum + Math.max(0, d.count), 0),
    [data],
  );
  const activeDays = useMemo(
    () => data.filter((d) => d.count > 0).length,
    [data],
  );
  const avgDaily = useMemo(
    () => (activeDays > 0 ? Math.round(totalCredits / activeDays) : 0),
    [totalCredits, activeDays],
  );

  return (
    <div>
      {/* Stats */}
      <div className="flex items-center gap-6 mb-5">
        <div>
          <p className="text-xl font-semibold text-t-primary font-mono">
            {totalCredits.toLocaleString()}
          </p>
          <p className="text-xs text-t-tertiary">total used</p>
        </div>
        <div className="h-8 w-px bg-b-secondary" />
        <div>
          <p className="text-xl font-semibold text-t-primary font-mono">
            {activeDays}
          </p>
          <p className="text-xs text-t-tertiary">active days</p>
        </div>
        <div className="h-8 w-px bg-b-secondary" />
        <div>
          <p className="text-xl font-semibold text-t-primary font-mono">
            {avgDaily}
          </p>
          <p className="text-xs text-t-tertiary">avg per day</p>
        </div>
      </div>

      {/* Bar chart */}
      <ChartContainer config={barChartConfig} className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weeklyData}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-secondary, rgba(255,255,255,0.06))"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: "var(--text-tertiary, #94a3b8)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--text-tertiary, #94a3b8)" }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: "var(--input-bg, rgba(255,255,255,0.03))" }}
              content={({ active, payload, label }) => (
                <ChartTooltipContent
                  active={active}
                  payload={payload?.map((p) => ({
                    name: "Credits",
                    value: p.value as number,
                    color: "#8b5cf6",
                    dataKey: p.dataKey as string,
                  }))}
                  label={typeof label === "string" ? label : undefined}
                />
              )}
            />
            <Bar
              dataKey="credits"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              activeBar={{ fill: "#a78bfa" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);

  useEffect(() => {
    if (!user) return;
    // Fetch plan + daily usage in parallel
    Promise.all([
      fetch(`/api/user/plan?userId=${user.uid}`).then((r) => r.json()),
      fetch(
        `/api/user/credits/daily?userId=${user.uid}&days=180`,
      ).then((r) => r.json()),
    ])
      .then(([planData, usageData]) => {
        setPlan(planData as PlanInfo);
        if (Array.isArray(usageData?.days)) setDailyUsage(usageData.days);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const openPortal = useCallback(async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data: { url?: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // silent
    } finally {
      setPortalLoading(false);
    }
  }, [user]);

  return (
    <div className="h-screen w-full bg-surface text-t-primary p-3">
      <div className="h-full w-full rounded-2xl border border-b-secondary bg-surface overflow-hidden flex flex-col relative">

        {/* Header */}
        <header className="relative z-10 flex h-12 items-center justify-between px-5 border-b border-b-secondary">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-t-tertiary hover:text-t-secondary transition-colors no-underline"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <span className="text-[11px] font-mono text-t-tertiary uppercase tracking-wider">
            Billing
          </span>
        </header>

        {/* Content */}
        <div className="relative z-10 flex-1 flex items-start justify-center overflow-y-auto px-6 py-12">
          <div className="w-full max-w-3xl">
            <h1
              className="text-2xl font-semibold tracking-tight text-t-primary mb-8"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Billing & Subscription
            </h1>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-t-tertiary">
                <div className="size-2 rounded-full bg-t-tertiary animate-pulse" />
                Loading...
              </div>
            ) : plan ? (
              <div className="flex flex-col gap-6">
                {/* Current plan card */}
                <div className="rounded-xl border border-b-secondary bg-surface-elevated p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary mb-1">
                        Current plan
                      </p>
                      <p className="text-xl font-semibold text-t-primary">
                        {planLabels[plan.plan] || plan.plan}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider font-semibold ${
                        plan.plan === "FREE"
                          ? "bg-surface-sunken text-t-secondary dark:bg-white/8 dark:text-t-tertiary"
                          : "bg-btn-primary-bg text-btn-primary-text"
                      }`}
                    >
                      {plan.plan === "FREE" ? "Free tier" : "Active"}
                    </span>
                  </div>

                  {plan.billingInterval && (
                    <p className="text-xs text-t-tertiary mb-2">
                      Billed {plan.billingInterval}
                    </p>
                  )}

                  {plan.plan !== "FREE" && (
                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-b-secondary">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary mb-0.5">
                            AI Credits
                          </p>
                          <p className="text-lg font-semibold text-t-primary font-mono">
                            {plan.credits.toLocaleString()}
                          </p>
                        </div>
                        {plan.creditsResetAt && (
                          <div>
                            <p className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary mb-0.5">
                              Resets
                            </p>
                            <p className="text-xs text-t-secondary">
                              {new Date(plan.creditsResetAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                      <Link
                        href="/billing/credits"
                        className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary hover:text-t-secondary transition-colors no-underline"
                      >
                        View usage →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Usage bar chart */}
                <div className="rounded-xl border border-b-secondary bg-surface-elevated p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-t-primary">
                      Daily Credit Usage
                    </h2>
                    <Link
                      href="/billing/credits"
                      className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary hover:text-t-secondary transition-colors no-underline"
                    >
                      View logs →
                    </Link>
                  </div>
                  {dailyUsage.length > 0 ? (
                    <UsageBarChart data={dailyUsage} />
                  ) : (
                    <p className="text-xs text-t-tertiary py-8 text-center">
                      No usage data yet
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  {plan.plan === "FREE" ? (
                    <Link
                      href="/pricing"
                      className="flex h-10 items-center justify-center rounded-lg bg-btn-primary-bg text-sm font-semibold text-btn-primary-text transition-colors hover:opacity-90 no-underline"
                    >
                      Upgrade your plan
                    </Link>
                  ) : (
                    <>
                      {plan.hasStripeAccount && (
                        <button
                          type="button"
                          onClick={openPortal}
                          disabled={portalLoading}
                          className="flex h-10 items-center justify-center rounded-lg border border-b-secondary bg-surface-elevated text-sm font-medium text-t-primary shadow-xs transition-colors hover:bg-surface-sunken dark:hover:bg-white/6 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                        >
                          {portalLoading ? "Opening..." : "Manage subscription"}
                        </button>
                      )}
                      <Link
                        href="/pricing"
                        className="flex h-10 items-center justify-center rounded-lg border border-b-secondary bg-surface-elevated text-sm font-medium text-t-secondary shadow-xs transition-colors hover:bg-surface-sunken hover:text-t-primary dark:hover:bg-white/6 no-underline"
                      >
                        Change plan
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-t-tertiary">
                Unable to load billing info.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
