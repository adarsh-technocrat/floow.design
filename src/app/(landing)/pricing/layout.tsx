import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for floow.design. Start designing mobile apps with AI for free.",
  alternates: {
    canonical: "https://www.floow.design/pricing",
  },
  openGraph: {
    title: "Pricing – floow.design",
    description:
      "Simple, transparent pricing for floow.design. Start designing mobile apps with AI for free.",
    url: "https://www.floow.design/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
