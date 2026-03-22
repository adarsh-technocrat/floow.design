/**
 * Run: npx tsx scripts/setup-stripe-products.ts
 *
 * Creates a single "floow.design" product on Stripe with 8 prices
 * (4 plans × monthly/yearly) and prints the env vars to paste into .env.local
 */

import Stripe from "stripe";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey) {
  console.error("STRIPE_SECRET_KEY not found in .env.local");
  process.exit(1);
}

const stripe = new Stripe(apiKey, {
  apiVersion: "2026-02-25.clover",
});

const plans = [
  {
    key: "LITE",
    monthly: 999, // $9.99
    yearly: 9588, // $7.99/mo × 12 = $95.88/yr
  },
  {
    key: "STARTER",
    monthly: 1749, // $17.49
    yearly: 16788, // $13.99/mo × 12 = $167.88/yr
  },
  {
    key: "PRO",
    monthly: 4999, // $49.99
    yearly: 47988, // $39.99/mo × 12 = $479.88/yr
  },
  {
    key: "TEAM",
    monthly: 6999, // $69.99
    yearly: 67188, // $55.99/mo × 12 = $671.88/yr
  },
];

async function main() {
  console.log("Creating floow.design product on Stripe...\n");

  // Create one product
  const product = await stripe.products.create({
    name: "floow.design",
    description: "AI-powered Flutter app design and code generation",
  });

  console.log(`Product created: ${product.id}\n`);

  const envLines: string[] = [];

  for (const plan of plans) {
    // Monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthly,
      currency: "usd",
      recurring: { interval: "month" },
      nickname: `${plan.key} Monthly`,
    });

    // Yearly price
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.yearly,
      currency: "usd",
      recurring: { interval: "year" },
      nickname: `${plan.key} Yearly`,
    });

    console.log(`${plan.key}:`);
    console.log(`  Monthly: ${monthlyPrice.id} ($${(plan.monthly / 100).toFixed(2)}/mo)`);
    console.log(`  Yearly:  ${yearlyPrice.id} ($${(plan.yearly / 100).toFixed(2)}/yr)\n`);

    envLines.push(`STRIPE_PRICE_${plan.key}_MONTHLY=${monthlyPrice.id}`);
    envLines.push(`STRIPE_PRICE_${plan.key}_YEARLY=${yearlyPrice.id}`);
  }

  console.log("─── Add these to .env.local ───\n");
  console.log(envLines.join("\n"));
  console.log("\n───────────────────────────────");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
