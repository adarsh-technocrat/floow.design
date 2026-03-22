"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

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

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

function UsageHeatmap({ data }: { data: DailyUsage[] }) {
  const maxCount = useMemo(
    () => Math.max(1, ...data.map((d) => d.count)),
    [data],
  );

  // Build weeks (columns) — each column is 7 days (Sun–Sat)
  const weeks = useMemo(() => {
    const result: DailyUsage[][] = [];
    let week: DailyUsage[] = [];

    // Pad the first week so it starts on Sunday
    if (data.length > 0) {
      const firstDay = new Date(data[0].date).getDay();
      for (let i = 0; i < firstDay; i++) {
        week.push({ date: "", count: -1 }); // placeholder
      }
    }

    for (const day of data) {
      week.push(day);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }
    if (week.length > 0) result.push(week);
    return result;
  }, [data]);

  // Month labels positioned at the first week of each month
  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; weekIndex: number }> = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      for (const day of week) {
        if (day.date) {
          const m = new Date(day.date).getMonth();
          if (m !== lastMonth) {
            labels.push({ label: MONTHS[m], weekIndex: wi });
            lastMonth = m;
          }
          break;
        }
      }
    });
    return labels;
  }, [weeks]);

  const getColor = (count: number): string => {
    if (count < 0) return "transparent";
    if (count === 0) return "var(--input-bg, rgba(255,255,255,0.03))";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "rgba(139, 92, 246, 0.2)";
    if (ratio <= 0.5) return "rgba(139, 92, 246, 0.4)";
    if (ratio <= 0.75) return "rgba(139, 92, 246, 0.6)";
    return "rgba(139, 92, 246, 0.85)";
  };

  const totalCredits = useMemo(
    () => data.reduce((sum, d) => sum + Math.max(0, d.count), 0),
    [data],
  );
  const activeDays = useMemo(
    () => data.filter((d) => d.count > 0).length,
    [data],
  );

  return (
    <div>
      {/* Stats row */}
      <div className="flex items-center gap-6 mb-4">
        <div>
          <p className="text-lg font-semibold text-t-primary font-mono">
            {totalCredits.toLocaleString()}
          </p>
          <p className="text-[11px] text-t-tertiary">credits used</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-t-primary font-mono">
            {activeDays}
          </p>
          <p className="text-[11px] text-t-tertiary">active days</p>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex ml-8 mb-1">
            {monthLabels.map((ml, i) => (
              <span
                key={i}
                className="text-[10px] text-t-tertiary"
                style={{
                  position: "relative",
                  left: `${ml.weekIndex * 14}px`,
                  marginRight: i < monthLabels.length - 1
                    ? `${((monthLabels[i + 1]?.weekIndex ?? ml.weekIndex) - ml.weekIndex) * 14 - 24}px`
                    : 0,
                }}
              >
                {ml.label}
              </span>
            ))}
          </div>

          <div className="flex gap-[2px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-1 pt-0">
              {DAYS.map((d, i) => (
                <div
                  key={i}
                  className="h-[12px] flex items-center text-[9px] text-t-tertiary leading-none"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day, di) => (
                  <div
                    key={`${wi}-${di}`}
                    className="w-[12px] h-[12px] rounded-[2px] transition-colors"
                    style={{ backgroundColor: getColor(day.count) }}
                    title={
                      day.date
                        ? `${day.date}: ${day.count > 0 ? day.count + " credits" : "No activity"}`
                        : ""
                    }
                  />
                ))}
                {/* Pad incomplete last week */}
                {week.length < 7 &&
                  Array.from({ length: 7 - week.length }).map((_, pi) => (
                    <div
                      key={`pad-${pi}`}
                      className="w-[12px] h-[12px] rounded-[2px]"
                      style={{ backgroundColor: "transparent" }}
                    />
                  ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <span className="text-[10px] text-t-tertiary mr-1">Less</span>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <div
                key={i}
                className="w-[12px] h-[12px] rounded-[2px]"
                style={{
                  backgroundColor:
                    ratio === 0
                      ? "var(--input-bg, rgba(255,255,255,0.03))"
                      : `rgba(139, 92, 246, ${0.2 + ratio * 0.65})`,
                }}
              />
            ))}
            <span className="text-[10px] text-t-tertiary ml-1">More</span>
          </div>
        </div>
      </div>
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
      <div className="h-full w-full rounded-2xl border border-b-secondary bg-canvas-bg overflow-hidden flex flex-col relative">
        {/* Dotted bg */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

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
          <div className="w-full max-w-lg">
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

                {/* Usage heatmap */}
                <div className="rounded-xl border border-b-secondary bg-surface-elevated p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-t-primary">
                      Credit Usage
                    </h2>
                    <span className="text-[11px] text-t-tertiary">
                      Last 6 months
                    </span>
                  </div>
                  {dailyUsage.length > 0 ? (
                    <UsageHeatmap data={dailyUsage} />
                  ) : (
                    <p className="text-xs text-t-tertiary py-4 text-center">
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
