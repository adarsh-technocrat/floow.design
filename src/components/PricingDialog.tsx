"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    name: "Lite",
    badge: "Early Bird",
    description: "Good for trying out",
    monthly: { price: 9.99, original: null as number | null, period: "/mo" },
    yearly: { price: 7.99, original: 9.99, period: "/mo" },
    cta: "Get Lite",
    popular: false,
    credits: { monthly: 1000, yearly: 12000 },
    screens: { monthly: "≈ 30 screens", yearly: "≈ 360 screens" },
    features: [
      "2 projects",
      "Unlimited code exports",
      "Unlimited Figma exports",
      "Export to AI builders",
    ],
  },
  {
    name: "Starter",
    badge: "30% OFF",
    description: "For higher limits",
    monthly: { price: 17.49, original: 24.99, period: "/mo" },
    yearly: { price: 13.99, original: 24.99, period: "/mo" },
    cta: "Get Starter",
    popular: false,
    credits: { monthly: 3000, yearly: 36000 },
    screens: { monthly: "≈ 100 screens", yearly: "≈ 1,200 screens" },
    features: [
      "5 projects",
      "Unlimited code exports",
      "Unlimited Figma exports",
      "Export to AI builders",
      "Share preview links",
    ],
  },
  {
    name: "Pro",
    badge: "Early Bird",
    description: "For even higher AI limits",
    monthly: { price: 49.99, original: null as number | null, period: "/mo" },
    yearly: { price: 39.99, original: 49.99, period: "/mo" },
    cta: "Get Pro",
    popular: true,
    credits: { monthly: 20000, yearly: 240000 },
    screens: { monthly: "≈ 650 screens", yearly: "≈ 7,800 screens" },
    features: [
      "Unlimited projects",
      "Purchase additional credits",
      "Unlimited code exports",
      "Unlimited Figma exports",
      "Export to AI builders",
      "Share preview links",
      "REST API access",
    ],
  },
  {
    name: "Team",
    badge: "Early Bird",
    description: "Built for collaboration",
    monthly: {
      price: 69.99,
      original: null as number | null,
      period: "/user/mo",
    },
    yearly: { price: 55.99, original: 69.99, period: "/user/mo" },
    cta: "Get Team",
    popular: false,
    credits: { monthly: 30000, yearly: 360000 },
    screens: {
      monthly: "≈ 1,000 screens per seat",
      yearly: "≈ 12,000 screens per seat",
    },
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Priority support",
      "Centralized billing",
    ],
  },
];

interface PricingDialogProps {
  open: boolean;
  onClose: () => void;
  reason?: "no_plan" | "insufficient_credits";
}

export function PricingDialog({ open, onClose, reason }: PricingDialogProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (!open) return null;

  const handleSelect = async (planName: string) => {
    if (!user) {
      router.push("/signin?redirect=/pricing");
      onClose();
      return;
    }

    setLoadingPlan(planName);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          plan: planName,
          interval: billing,
        }),
      });
      const data: { url?: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // silent
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] rounded-2xl border border-b-secondary bg-surface-elevated shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 border-b border-b-secondary bg-surface-elevated/95 backdrop-blur-sm">
          <div>
            <h2
              className="text-xl md:text-2xl font-semibold text-t-primary"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              {reason === "insufficient_credits"
                ? "You've used all your credits"
                : "Choose a plan to get started"}
            </h2>
            <p className="text-sm text-t-secondary mt-1">
              {reason === "insufficient_credits"
                ? "Upgrade your plan or wait for your credits to refresh."
                : "A subscription is required to use AI design features."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-t-tertiary hover:bg-input-bg hover:text-t-primary transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center border-b border-b-secondary px-6 py-4">
          <div className="inline-flex rounded-lg border border-b-secondary bg-input-bg p-0.5">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-md px-4 py-1.5 text-[11px] font-mono font-medium uppercase tracking-wider transition-colors ${
                billing === "monthly"
                  ? "bg-surface-elevated text-t-primary shadow-sm"
                  : "text-t-tertiary hover:text-t-secondary"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[11px] font-mono font-medium uppercase tracking-wider transition-colors ${
                billing === "yearly"
                  ? "bg-surface-elevated text-t-primary shadow-sm"
                  : "text-t-tertiary hover:text-t-secondary"
              }`}
            >
              Yearly
              <span className="text-[9px] text-green-500 font-semibold">
                2 mo free
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          {plans.map((plan) => {
            const tier = plan[billing];
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border p-5 transition-colors ${
                  plan.popular
                    ? "border-btn-primary-bg bg-btn-primary-bg/5 shadow-md"
                    : "border-b-secondary hover:border-b-strong"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-4 rounded bg-btn-primary-bg px-2.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-btn-primary-text">
                    Most Popular
                  </span>
                )}

                {/* Plan name & badge */}
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className="text-base font-semibold text-t-primary"
                    style={{
                      fontFamily:
                        "var(--font-logo), 'Space Grotesk', sans-serif",
                    }}
                  >
                    {plan.name}
                  </p>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-t-tertiary">
                  {plan.badge}
                </span>
                <p className="text-xs text-t-secondary mt-1 mb-4">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-0.5 mb-0.5">
                  <span className="text-[28px] font-light font-mono text-t-primary leading-none">
                    ${tier.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-t-tertiary font-mono">
                    {tier.period}
                  </span>
                </div>
                {tier.original && (
                  <span className="text-xs text-t-tertiary line-through font-mono">
                    ${tier.original.toFixed(2)}/mo
                  </span>
                )}
                <p className="text-[10px] text-t-tertiary font-mono mt-1 mb-4">
                  billed {billing}
                </p>

                {/* CTA */}
                <button
                  onClick={() => handleSelect(plan.name)}
                  disabled={loadingPlan === plan.name}
                  className={`flex h-10 w-full items-center justify-center rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 mb-5 ${
                    plan.popular
                      ? "bg-btn-primary-bg text-btn-primary-text hover:opacity-90"
                      : "border border-b-secondary text-t-primary hover:bg-input-bg"
                  }`}
                >
                  {loadingPlan === plan.name ? (
                    <div className="size-3.5 rounded-full border-2 border-current/30 border-t-transparent animate-spin" />
                  ) : (
                    plan.cta
                  )}
                </button>

                {/* Credits */}
                <p className="text-sm font-medium text-t-primary">
                  {plan.credits[billing].toLocaleString()} AI credits
                </p>
                <p className="text-[10px] text-t-tertiary mb-4">
                  {plan.screens[billing]} /{" "}
                  {billing === "monthly" ? "month" : "year"}
                </p>

                {/* Features */}
                <span className="text-[9px] font-mono uppercase tracking-widest text-t-tertiary mb-2">
                  Includes
                </span>
                <div className="flex flex-col gap-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="text-t-secondary shrink-0"
                      >
                        <path
                          d="M3 8.5L6 11.5L13 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-xs text-t-secondary">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-b-secondary bg-input-bg/30">
          <p className="text-[11px] text-t-tertiary">
            All plans include unlimited code & Figma exports. Cancel anytime.
          </p>
          <button
            onClick={() => {
              router.push("/pricing");
              onClose();
            }}
            className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary hover:text-t-secondary transition-colors"
          >
            Full comparison →
          </button>
        </div>
      </div>
    </div>
  );
}
