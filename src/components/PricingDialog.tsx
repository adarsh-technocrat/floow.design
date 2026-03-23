"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createCheckoutSession, openStripePortal } from "@/store/slices/userSlice";
import NumberFlow from "@number-flow/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { SeatPicker } from "@/components/SeatPicker";

const PLAN_ORDER = ["FREE", "LITE", "STARTER", "PRO", "TEAM"];

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

function formatResetDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  if (diff < 0) return "soon";
  const days = Math.ceil(diff / 86_400_000);
  if (days <= 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface PricingDialogProps {
  open: boolean;
  onClose: () => void;
  reason?: "no_plan" | "insufficient_credits";
}

export function PricingDialog({ open, onClose, reason }: PricingDialogProps) {
  const { user } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userPlan = useAppSelector((s) => s.user.plan);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [teamSeats, setTeamSeats] = useState(3);

  const currentPlanName = userPlan?.plan?.toUpperCase() ?? "FREE";
  const currentPlanIdx = PLAN_ORDER.indexOf(currentPlanName);
  const isExhausted = reason === "insufficient_credits";
  const resetDate = isExhausted ? formatResetDate(userPlan?.creditsResetAt ?? null) : null;

  const getPlanRelation = (planName: string): "current" | "upgrade" | "downgrade" => {
    const idx = PLAN_ORDER.indexOf(planName.toUpperCase());
    if (idx === currentPlanIdx) return "current";
    return idx > currentPlanIdx ? "upgrade" : "downgrade";
  };

  const handleSelect = async (planName: string) => {
    if (!user) {
      router.push("/signin?redirect=/pricing");
      onClose();
      return;
    }

    const relation = getPlanRelation(planName);

    if (relation === "current") {
      setLoadingPlan(planName);
      try {
        await dispatch(openStripePortal(user.uid)).unwrap();
      } catch { /* silent */ }
      setLoadingPlan(null);
      return;
    }

    setLoadingPlan(planName);
    try {
      await dispatch(
        createCheckoutSession({
          userId: user.uid,
          plan: planName,
          interval: billing,
          ...(planName.toUpperCase() === "TEAM" ? { seats: teamSeats } : {}),
        }),
      ).unwrap();
    } catch {
      // silent
    } finally {
      setLoadingPlan(null);
    }
  };

  const getButtonLabel = (planName: string) => {
    if (loadingPlan === planName) return null;
    const relation = getPlanRelation(planName);
    if (relation === "current") return "Manage Plan";
    if (relation === "downgrade") return `Downgrade to ${planName}`;
    return `Upgrade to ${planName}`;
  };

  const getButtonStyle = (planName: string, popular: boolean) => {
    const relation = getPlanRelation(planName);
    if (relation === "current") {
      return "border border-emerald-500/40 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15";
    }
    if (popular) {
      return "bg-btn-primary-bg text-btn-primary-text hover:opacity-90";
    }
    return "border border-b-secondary text-t-primary hover:bg-input-bg";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="flex max-h-[90vh] min-h-0 flex-col overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="sticky top-0 z-20 flex shrink-0 flex-row items-start justify-between gap-4 space-y-0 px-6 py-5 border-b border-b-secondary bg-surface-elevated/95 backdrop-blur-sm">
          <div>
            <DialogTitle
              className="text-xl md:text-2xl font-semibold text-t-primary"
              style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
            >
              {isExhausted
                ? "You've used all your credits"
                : "Choose a plan to get started"}
            </DialogTitle>
            <p className="text-sm text-t-secondary mt-1">
              {isExhausted
                ? resetDate
                  ? `Your credits will refresh ${resetDate}. Upgrade for more credits now.`
                  : "Upgrade your plan for more credits, or wait for your allowance to refresh."
                : "A subscription is required to use AI design features."}
            </p>
            {isExhausted && currentPlanName !== "FREE" && (
              <p className="mt-2 text-xs text-t-tertiary">
                Current plan: <span className="font-medium text-t-secondary">{currentPlanName.charAt(0) + currentPlanName.slice(1).toLowerCase()}</span>
                {userPlan && (
                  <> &middot; {userPlan.credits}/{userPlan.creditCap} credits remaining</>
                )}
              </p>
            )}
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-t-tertiary transition-colors hover:bg-input-bg hover:text-t-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">

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
              <span className="text-[11px] text-green-500 font-semibold">
                2 mo free
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          {plans.map((plan) => {
            const tier = plan[billing];
            const relation = getPlanRelation(plan.name);
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border p-5 transition-colors ${
                  relation === "current"
                    ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                    : plan.popular
                      ? "border-btn-primary-bg bg-btn-primary-bg/5 shadow-md"
                      : "border-b-secondary hover:border-b-strong"
                }`}
              >
                {relation === "current" && (
                  <span className="absolute -top-2.5 left-4 rounded bg-emerald-500 px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-white">
                    Current Plan
                  </span>
                )}
                {plan.popular && relation !== "current" && (
                  <span className="absolute -top-2.5 left-4 rounded bg-btn-primary-bg px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-btn-primary-text">
                    Most Popular
                  </span>
                )}

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
                <span className="text-[11px] font-mono uppercase tracking-wider text-t-tertiary">
                  {plan.badge}
                </span>
                <p className="text-xs text-t-secondary mt-1 mb-4">
                  {plan.description}
                </p>

                {plan.name === "Team" && (
                  <div className="mb-3">
                    <SeatPicker seats={teamSeats} onSeatsChange={setTeamSeats} />
                  </div>
                )}

                <div className="flex items-baseline gap-0.5 mb-0.5">
                  <NumberFlow
                    value={plan.name === "Team" ? tier.price * teamSeats : tier.price}
                    format={{ style: "currency", currency: "USD", minimumFractionDigits: 2 }}
                    className="text-[28px] font-light font-mono text-t-primary leading-none"
                  />
                  <span className="text-xs text-t-tertiary font-mono">
                    {plan.name === "Team" ? "/mo" : tier.period}
                  </span>
                </div>
                {tier.original && (
                  <span className="text-xs text-t-tertiary line-through font-mono">
                    <NumberFlow
                      value={plan.name === "Team" ? tier.original * teamSeats : tier.original}
                      format={{ style: "currency", currency: "USD", minimumFractionDigits: 2 }}
                    />
                    /mo
                  </span>
                )}
                <p className="text-[11px] text-t-tertiary font-mono mt-1 mb-4">
                  {plan.name === "Team"
                    ? `${teamSeats} seat${teamSeats > 1 ? "s" : ""} · billed ${billing}`
                    : `billed ${billing}`}
                </p>

                <button
                  onClick={() => handleSelect(plan.name)}
                  disabled={loadingPlan === plan.name}
                  className={`flex h-10 w-full items-center justify-center rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 mb-5 ${getButtonStyle(plan.name, plan.popular)}`}
                >
                  {loadingPlan === plan.name ? (
                    <div className="size-3.5 rounded-full border-2 border-current/30 border-t-transparent animate-spin" />
                  ) : (
                    getButtonLabel(plan.name)
                  )}
                </button>

                <p className="text-sm font-medium text-t-primary">
                  <NumberFlow
                    value={plan.name === "Team" ? plan.credits[billing] * teamSeats : plan.credits[billing]}
                    format={{ useGrouping: true }}
                  />{" "}
                  AI credits
                </p>
                <p className="text-[11px] text-t-tertiary mb-4">
                  {plan.screens[billing]} /{" "}
                  {billing === "monthly" ? "month" : "year"}
                </p>

                <span className="text-[11px] font-mono uppercase tracking-widest text-t-tertiary mb-2">
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
      </DialogContent>
    </Dialog>
  );
}
