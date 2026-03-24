import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error(
    "Set STRIPE_SECRET_KEY env var (use your LIVE key: sk_live_...)",
  );
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

const PLANS = [
  {
    name: "Lite",
    description: "Good for trying out — 2 projects, unlimited exports",
    monthly: 999,
    yearly: 799 * 12,
  },
  {
    name: "Starter",
    description: "For higher limits — 5 projects, share preview links",
    monthly: 1749,
    yearly: 1399 * 12,
  },
  {
    name: "Pro",
    description: "For even higher AI limits — unlimited projects, REST API",
    monthly: 4999,
    yearly: 3999 * 12,
  },
  {
    name: "Team",
    description: "Built for collaboration — per seat, priority support",
    monthly: 6999,
    yearly: 5599 * 12,
  },
];

async function main() {
  console.log("\n🚀 Creating Stripe products and prices...\n");
  console.log(
    `Mode: ${STRIPE_SECRET_KEY!.startsWith("sk_live") ? "LIVE 🔴" : "TEST 🟡"}\n`,
  );

  const envLines: string[] = [];

  for (const plan of PLANS) {
    const product = await stripe.products.create({
      name: `floow.design ${plan.name}`,
      description: plan.description,
      metadata: { plan: plan.name.toUpperCase() },
    });

    console.log(`✅ Product: ${product.name} (${product.id})`);

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthly,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan: plan.name.toUpperCase(), interval: "monthly" },
    });

    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.yearly,
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { plan: plan.name.toUpperCase(), interval: "yearly" },
    });

    const key = plan.name.toUpperCase();
    console.log(
      `   Monthly: $${(plan.monthly / 100).toFixed(2)}/mo → ${monthlyPrice.id}`,
    );
    console.log(
      `   Yearly:  $${(plan.yearly / 100 / 12).toFixed(2)}/mo (billed $${(plan.yearly / 100).toFixed(2)}/yr) → ${yearlyPrice.id}\n`,
    );

    envLines.push(`STRIPE_PRICE_${key}_MONTHLY=${monthlyPrice.id}`);
    envLines.push(`STRIPE_PRICE_${key}_YEARLY=${yearlyPrice.id}`);
  }

  console.log("\n📋 Add these to your .env.local or Vercel env vars:\n");
  console.log(envLines.join("\n"));
  console.log("");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
