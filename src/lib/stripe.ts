import Stripe from "stripe";

export { PLAN_CREDITS } from "./plan-credits";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const PLAN_PRICE_IDS: Record<
  string,
  { monthly: string; yearly: string }
> = {
  LITE: {
    monthly: process.env.STRIPE_PRICE_LITE_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_LITE_YEARLY!,
  },
  STARTER: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY!,
  },
  PRO: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  },
  TEAM: {
    monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_TEAM_YEARLY!,
  },
};
