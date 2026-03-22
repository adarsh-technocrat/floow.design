"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NumberFlow from "@number-flow/react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    name: "Lite",
    badge: "Early Bird",
    description: "Good for trying out",
    monthly: { price: 9.99, original: null as number | null, period: "/mo" },
    yearly: { price: 7.99, original: 9.99, period: "/mo" },
    cta: "Upgrade to Lite",
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
    badge: "30% OFF APPLIED",
    description: "For higher limits",
    monthly: { price: 17.49, original: 24.99, period: "/mo" },
    yearly: { price: 13.99, original: 24.99, period: "/mo" },
    cta: "Upgrade to Starter",
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
    cta: "Upgrade to Pro",
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
    cta: "Upgrade to Team",
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

function Cell({
  children,
  className = "",
  columnDivider = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Vertical rule between plan columns (desktop table) */
  columnDivider?: boolean;
}) {
  return (
    <td
      className={`px-5 py-4 align-top ${columnDivider ? "border-l border-b-secondary" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const handleUpgrade = async (planName: string) => {
    if (!user) {
      router.push(`/signin?redirect=/pricing`);
      return;
    }

    setCheckoutLoading(planName);
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
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="w-full bg-surface text-t-primary">
      <div className="relative mx-auto max-w-6xl border-x border-b-secondary">
        <Header />

        {/* Hero */}
        <div className="px-5 py-12 md:px-12 md:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h1
              className="text-[28px] md:text-[40px] font-semibold leading-tight tracking-tight text-t-primary"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-sm md:text-base text-t-secondary leading-relaxed max-w-md mx-auto">
              Start building for free. Upgrade when you need more AI credits and
              features.
            </p>
          </div>
        </div>

        {/* Monthly / Yearly toggle */}
        <div className="flex items-center justify-center border-t border-b-secondary px-5 py-4">
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
              <span className="text-[9px] text-green-400 font-semibold">
                2 mo free
              </span>
            </button>
          </div>
        </div>

        {/* Mobile cards (stacked) */}
        <div className="border-t border-b-secondary lg:hidden">
          {plans.map((plan, i) => {
            const tier = plan[billing];
            return (
              <div
                key={plan.name}
                className={`px-5 py-8 ${i > 0 ? "border-t border-b-secondary" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-sm font-semibold text-t-primary"
                    style={{
                      fontFamily:
                        "var(--font-logo), 'Space Grotesk', sans-serif",
                    }}
                  >
                    {plan.name}
                  </span>
                  {plan.popular && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-btn-primary-text bg-btn-primary-bg rounded px-1.5 py-0.5 font-semibold">
                      Most Popular
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-t-tertiary">
                  {plan.badge}
                </span>
                <p className="text-xs text-t-secondary mt-1 mb-4">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-0.5 mb-1">
                  <NumberFlow
                    value={tier.price}
                    format={{
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 2,
                    }}
                    className="text-[32px] font-light text-t-primary font-mono leading-none"
                  />
                  {tier.period && (
                    <span className="text-xs text-t-tertiary font-mono">
                      {tier.period}
                    </span>
                  )}
                </div>
                {tier.original && (
                  <span className="text-xs text-t-tertiary line-through font-mono">
                    <NumberFlow
                      value={tier.original}
                      format={{
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      }}
                    />
                    /mo
                  </span>
                )}
                <p className="text-[11px] text-t-tertiary font-mono mt-1 mb-4">
                  billed {billing}
                </p>

                <button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={checkoutLoading === plan.name}
                  className={`flex h-10 w-full items-center justify-center rounded text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors mb-4 disabled:opacity-50 ${plan.popular ? "bg-btn-primary-bg text-btn-primary-text hover:opacity-90" : "border border-b-secondary text-t-primary hover:bg-input-bg"}`}
                >
                  {checkoutLoading === plan.name ? "Loading..." : plan.cta}
                </button>

                <p className="text-sm font-medium text-t-primary">
                  <NumberFlow
                    value={plan.credits[billing]}
                    format={{ useGrouping: true }}
                  />{" "}
                  AI credits / {billing === "monthly" ? "month" : "year"}
                </p>
                <p className="text-xs text-t-tertiary mb-4">
                  {plan.screens[billing]}
                </p>

                <span className="text-[10px] font-mono uppercase tracking-widest text-t-tertiary mb-2 block">
                  Includes
                </span>
                <div className="flex flex-col gap-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="text-t-secondary flex-shrink-0"
                      >
                        <path
                          d="M3 8.5L6 11.5L13 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm text-t-secondary">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table — rows are perfectly aligned */}
        <table className="hidden w-full border-collapse border-t border-b-secondary lg:table">
          <colgroup>
            {plans.map((p) => (
              <col key={p.name} className="w-1/4" />
            ))}
          </colgroup>

          {/* Row: Plan header */}
          <tbody>
            <tr>
              {plans.map((plan, i) => (
                <Cell key={plan.name} columnDivider={i > 0}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-sm font-semibold text-t-primary"
                      style={{
                        fontFamily:
                          "var(--font-logo), 'Space Grotesk', sans-serif",
                      }}
                    >
                      {plan.name}
                    </span>
                    {plan.popular && (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-btn-primary-text bg-btn-primary-bg rounded px-1.5 py-0.5 font-semibold">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-t-tertiary block mb-1">
                    {plan.badge}
                  </span>
                  <p className="text-xs text-t-secondary">{plan.description}</p>
                </Cell>
              ))}
            </tr>

            {/* Row: Price */}
            <tr className="[&>td]:border-t [&>td]:border-b-secondary">
              {plans.map((plan, i) => {
                const tier = plan[billing];
                return (
                  <Cell key={plan.name} columnDivider={i > 0} className="py-6">
                    <div className="flex items-baseline gap-0.5">
                      <NumberFlow
                        value={tier.price}
                        format={{
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 2,
                        }}
                        className="text-[36px] font-light text-t-primary font-mono leading-none"
                      />
                      {tier.period && (
                        <span className="text-xs text-t-tertiary font-mono">
                          {tier.period}
                        </span>
                      )}
                    </div>
                    {tier.original && (
                      <div className="mt-1">
                        <span className="text-xs text-t-tertiary line-through font-mono">
                          <NumberFlow
                            value={tier.original}
                            format={{
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 2,
                            }}
                          />
                          /mo
                        </span>
                      </div>
                    )}
                    <p className="mt-1 text-[11px] text-t-tertiary font-mono">
                      billed {billing}
                    </p>
                  </Cell>
                );
              })}
            </tr>

            {/* Row: CTA */}
            <tr className="[&>td]:border-t [&>td]:border-b-secondary">
              {plans.map((plan, i) => (
                <Cell key={plan.name} columnDivider={i > 0}>
                  <button
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={checkoutLoading === plan.name}
                    className={`flex h-10 w-full items-center justify-center rounded text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      plan.popular
                        ? "bg-btn-primary-bg text-btn-primary-text hover:opacity-90"
                        : "border border-b-secondary text-t-primary hover:bg-input-bg"
                    }`}
                  >
                    {checkoutLoading === plan.name ? "Loading..." : plan.cta}
                  </button>
                </Cell>
              ))}
            </tr>

            {/* Row: Credits */}
            <tr className="[&>td]:border-t [&>td]:border-b-secondary">
              {plans.map((plan, i) => (
                <Cell key={plan.name} columnDivider={i > 0}>
                  <p className="text-sm font-medium text-t-primary">
                    <NumberFlow
                      value={plan.credits[billing]}
                      format={{ useGrouping: true }}
                    />{" "}
                    AI credits / {billing === "monthly" ? "month" : "year"}
                  </p>
                  <p className="mt-0.5 text-xs text-t-tertiary">
                    {plan.screens[billing]}
                  </p>
                </Cell>
              ))}
            </tr>

            {/* Row: Features */}
            <tr className="[&>td]:border-t [&>td]:border-b-secondary">
              {plans.map((plan, i) => (
                <Cell key={plan.name} columnDivider={i > 0} className="py-5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-t-tertiary mb-3 block">
                    Includes
                  </span>
                  <div className="flex flex-col gap-2.5">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="text-t-secondary flex-shrink-0"
                        >
                          <path
                            d="M3 8.5L6 11.5L13 4.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-sm text-t-secondary">{f}</span>
                      </div>
                    ))}
                  </div>
                </Cell>
              ))}
            </tr>
          </tbody>
        </table>

        <Footer />
      </div>
    </div>
  );
}
