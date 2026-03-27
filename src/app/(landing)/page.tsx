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

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is floow.design?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An AI-powered platform that turns your ideas into beautiful, high-fidelity mobile app designs in seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Is it free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Free with a daily credit system that resets every day. Premium plans available for more credits.",
      },
    },
    {
      "@type": "Question",
      name: "What platforms can I design for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Design for iOS and Android — with support for both Material and Cupertino design languages.",
      },
    },
    {
      "@type": "Question",
      name: "Can I export my designs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Export to Figma, share preview links, or export to AI builders to continue building.",
      },
    },
    {
      "@type": "Question",
      name: "Are the designs high-fidelity?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Pixel-perfect layouts with proper spacing, typography, theming, and responsive design.",
      },
    },
    {
      "@type": "Question",
      name: "Material and Cupertino support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Both. Choose the design language that fits your app.",
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <div className="relative w-full bg-surface text-t-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
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
