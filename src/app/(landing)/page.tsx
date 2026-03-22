import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { TemplatesCarousel } from "@/components/landing/TemplatesCarousel";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { StartNow } from "@/components/landing/StartNow";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Launchpad AI - Design to Flutter Code with AI",
  description:
    "Turn your app ideas into beautiful designs and production-ready Flutter code in seconds",
};

export default function LandingPage() {
  return (
    <div className="w-full bg-surface text-t-primary">
      <div className="mx-auto max-w-6xl">
        <Header />
        <main>
          <Hero />
          <TemplatesCarousel />
          <FeaturesGrid />
          <StartNow />
          <FAQ />
        </main>
        <Footer />
      </div>
    </div>
  );
}
