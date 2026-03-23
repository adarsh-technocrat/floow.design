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

interface CreditLogEntry {
  id: string;
  action: string;
  amount: number;
  balance: number;
  projectId: string | null;
  meta: string | null;
  createdAt: string;
}

const actionConfig: Record<string, { label: string; icon: string; color: string }> = {
  design: { label: "AI Design Generation", icon: "🎨", color: "bg-purple-500/15 text-purple-500" },
  chat: { label: "AI Chat", icon: "💬", color: "bg-blue-500/15 text-blue-500" },
  reset: { label: "Credits Refreshed", icon: "🔄", color: "bg-emerald-500/15 text-emerald-500" },
};

function formatLogDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
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
  const [logs, setLogs] = useState<CreditLogEntry[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsOffset, setLogsOffset] = useState(0);
  const logsLimit = 15;

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/api/user/plan?userId=${user.uid}`).then((r) => r.json()),
      fetch(`/api/user/credits/daily?userId=${user.uid}&days=180`).then((r) => r.json()),
      fetch(`/api/user/credits?userId=${user.uid}&limit=${logsLimit}&offset=0`).then((r) => r.json()),
    ])
      .then(([planData, usageData, logsData]) => {
        setPlan(planData as PlanInfo);
        if (Array.isArray(usageData?.days)) setDailyUsage(usageData.days);
        if (Array.isArray(logsData?.logs)) {
          setLogs(logsData.logs);
          setLogsTotal(logsData.total ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const fetchLogs = useCallback(
    async (offset: number) => {
      if (!user) return;
      const res = await fetch(
        `/api/user/credits?userId=${user.uid}&limit=${logsLimit}&offset=${offset}`,
      );
      const data = await res.json();
      if (Array.isArray(data?.logs)) {
        setLogs(data.logs);
        setLogsTotal(data.total ?? 0);
        setLogsOffset(offset);
      }
    },
    [user],
  );

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
              <div className="flex flex-col gap-6 animate-pulse">
                {/* Plan card shimmer */}
                <div className="rounded-xl border border-b-secondary bg-surface-elevated p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="h-3 w-20 rounded bg-input-bg mb-2" />
                      <div className="h-6 w-28 rounded bg-input-bg" />
                    </div>
                    <div className="h-7 w-16 rounded-full bg-input-bg" />
                  </div>
                  <div className="pt-4 border-t border-b-secondary flex gap-6">
                    <div>
                      <div className="h-3 w-16 rounded bg-input-bg mb-1" />
                      <div className="h-5 w-20 rounded bg-input-bg" />
                    </div>
                    <div>
                      <div className="h-3 w-12 rounded bg-input-bg mb-1" />
                      <div className="h-5 w-24 rounded bg-input-bg" />
                    </div>
                  </div>
                </div>
                {/* Chart shimmer */}
                <div className="rounded-xl border border-b-secondary bg-surface-elevated p-6">
                  <div className="h-4 w-32 rounded bg-input-bg mb-5" />
                  <div className="flex items-end gap-3 h-[180px]">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-input-bg"
                        style={{ height: `${20 + Math.random() * 60}%` }}
                      />
                    ))}
                  </div>
                </div>
                {/* Logs shimmer */}
                <div className="rounded-xl border border-b-secondary bg-surface-elevated p-6">
                  <div className="h-4 w-28 rounded bg-input-bg mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-input-bg shrink-0" />
                        <div className="flex-1">
                          <div className="h-3 w-24 rounded bg-input-bg mb-1.5" />
                          <div className="h-2.5 w-16 rounded bg-input-bg" />
                        </div>
                        <div className="h-3 w-12 rounded bg-input-bg" />
                      </div>
                    ))}
                  </div>
                </div>
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
                    </div>
                  )}
                </div>

                {/* Usage bar chart */}
                <div className="rounded-xl border border-b-secondary bg-surface-elevated p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-t-primary">
                      Daily Credit Usage
                    </h2>
                  </div>
                  {dailyUsage.length > 0 ? (
                    <UsageBarChart data={dailyUsage} />
                  ) : (
                    <p className="text-xs text-t-tertiary py-8 text-center">
                      No usage data yet
                    </p>
                  )}
                </div>

                {/* Credit logs */}
                <div className="rounded-xl border border-b-secondary bg-surface-elevated p-6">
                  <h2 className="text-sm font-semibold text-t-primary mb-4">
                    Recent Activity
                  </h2>
                  {logs.length === 0 ? (
                    <p className="text-xs text-t-tertiary py-6 text-center">
                      No credit activity yet
                    </p>
                  ) : (
                    <>
                      <div className="divide-y divide-b-secondary">
                        {logs.map((log) => {
                          const cfg = actionConfig[log.action] ?? {
                            label: log.action,
                            icon: "⚡",
                            color: "bg-input-bg text-t-secondary",
                          };
                          return (
                            <div
                              key={log.id}
                              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                            >
                              <div
                                className={`size-9 rounded-full flex items-center justify-center text-base shrink-0 ${cfg.color}`}
                              >
                                {cfg.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-t-primary truncate">
                                  {cfg.label}
                                </p>
                                <p className="text-xs text-t-tertiary">
                                  {formatLogDate(log.createdAt)}
                                  {log.meta && log.meta !== `AI ${log.action} generation`
                                    ? ` · ${log.meta}`
                                    : ""}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p
                                  className={`text-[13px] font-semibold font-mono ${
                                    log.amount > 0
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-t-primary"
                                  }`}
                                >
                                  {log.amount > 0 ? "+" : ""}
                                  {log.amount.toLocaleString()}
                                </p>
                                <p className="text-[11px] font-mono text-t-tertiary">
                                  bal {log.balance.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {logsTotal > logsLimit && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-b-secondary">
                          <p className="text-xs text-t-tertiary">
                            {logsOffset + 1}–
                            {Math.min(logsOffset + logsLimit, logsTotal)} of{" "}
                            {logsTotal}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                fetchLogs(Math.max(0, logsOffset - logsLimit))
                              }
                              disabled={logsOffset === 0}
                              className="rounded-md border border-b-secondary px-3 py-1.5 text-xs text-t-secondary hover:bg-input-bg disabled:opacity-30 disabled:pointer-events-none"
                            >
                              Prev
                            </button>
                            <button
                              onClick={() => fetchLogs(logsOffset + logsLimit)}
                              disabled={logsOffset + logsLimit >= logsTotal}
                              className="rounded-md border border-b-secondary px-3 py-1.5 text-xs text-t-secondary hover:bg-input-bg disabled:opacity-30 disabled:pointer-events-none"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
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
