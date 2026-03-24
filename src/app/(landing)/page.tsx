import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { TemplatesCarousel } from "@/components/landing/TemplatesCarousel";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { ProductDemo } from "@/components/landing/ProductDemo";
import { Testimonials } from "@/components/landing/Testimonials";
import { StartNow } from "@/components/landing/StartNow";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

import type { Metadata } from "next";

const pageDescription =
  "Design mobile apps with AI in seconds. Generate pixel-perfect iOS & Android screens, export to Figma, and ship faster. Used by 1,000+ designers & teams.";

export const metadata: Metadata = {
  title: "floow.design – Design mobile apps with AI",
  description: pageDescription,
  alternates: {
    canonical: "https://www.floow.design",
  },
  openGraph: {
    title: "floow.design – Design mobile apps with AI, in seconds",
    description: pageDescription,
    url: "https://www.floow.design",
  },
};

export default function LandingPage() {
  return (
    <div className="relative w-full bg-surface text-t-primary">
      <div className="relative mx-auto max-w-6xl border-x border-b-secondary">
        <Header />
        <main>
          <Hero />
          <TemplatesCarousel />
          <FeaturesGrid />
          <ProductDemo />
          <Testimonials />
          <StartNow />
          <FAQ />
        </main>
        <Footer />
      </div>
    </div>
  );
}
