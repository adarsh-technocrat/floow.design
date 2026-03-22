"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface PlanInfo {
  plan: string;
  billingInterval: string | null;
  credits: number;
  creditsResetAt: string | null;
  hasStripeAccount: boolean;
  hasSubscription: boolean;
}

const planLabels: Record<string, string> = {
  FREE: "Free",
  LITE: "Lite",
  STARTER: "Starter",
  PRO: "Pro",
  TEAM: "Team",
};

export default function BillingPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/user/plan?userId=${user.uid}`)
      .then((r) => r.json())
      .then((data: PlanInfo) => setPlan(data))
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
                          ? "bg-input-bg text-t-tertiary"
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
                              {new Date(
                                plan.creditsResetAt,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
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
                          onClick={openPortal}
                          disabled={portalLoading}
                          className="flex h-10 items-center justify-center rounded-lg border border-b-secondary text-sm font-medium text-t-primary transition-colors hover:bg-input-bg disabled:opacity-50"
                        >
                          {portalLoading
                            ? "Opening..."
                            : "Manage subscription"}
                        </button>
                      )}
                      <Link
                        href="/pricing"
                        className="flex h-10 items-center justify-center rounded-lg border border-b-secondary text-sm font-medium text-t-secondary transition-colors hover:bg-input-bg no-underline"
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
