import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { TemplatesCarousel } from "@/components/landing/TemplatesCarousel";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { ProductDemo } from "@/components/landing/ProductDemo";
import { Testimonials } from "@/components/landing/Testimonials";
import { StartNow } from "@/components/landing/StartNow";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "floow.design – Idea to Flutter app, in seconds",
  description:
    "Turn your app ideas into beautiful designs and production-ready Flutter code in seconds",
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
