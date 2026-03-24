import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for floow.design — learn how we collect, use, and protect your data.",
  alternates: { canonical: "https://www.floow.design/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="relative w-full bg-surface text-t-primary">
      <div className="relative mx-auto max-w-6xl border-x border-b-secondary">
        <Header />

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 md:px-16 md:py-20">
          <h1
            className="text-2xl md:text-4xl font-semibold tracking-tight text-t-primary mb-2"
            style={{
              fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
            }}
          >
            Privacy Policy
          </h1>
          <p className="text-sm text-t-tertiary font-mono mb-8">
            Last updated: March 24, 2026
          </p>

          <div className="prose prose-sm dark:prose-invert max-w-none text-t-secondary leading-relaxed space-y-6">
            <p>
              floow.design (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
              is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, and safeguard your information when
              you use our AI-powered mobile app design platform.
            </p>

            <h2 className="text-lg font-semibold text-t-primary mt-8 mb-3">
              Information We Collect
            </h2>
            <p>
              We collect information you provide directly, including your name,
              email address, and payment information when you create an account
              or subscribe to a plan. We also collect usage data such as designs
              created, features used, and interaction patterns to improve our
              service.
            </p>

            <h2 className="text-lg font-semibold text-t-primary mt-8 mb-3">
              How We Use Your Information
            </h2>
            <p>
              We use your information to provide and improve our{" "}
              <Link
                href="/#features"
                className="underline hover:text-t-primary"
              >
                design features
              </Link>
              , process payments, send important updates, and provide customer
              support. We do not sell your personal information to third
              parties.
            </p>

            <h2 className="text-lg font-semibold text-t-primary mt-8 mb-3">
              Data Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your
              data. Your designs and project files are encrypted in transit and
              at rest.
            </p>

            <h2 className="text-lg font-semibold text-t-primary mt-8 mb-3">
              Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              at privacy@floow.design.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-[11px] font-mono text-t-tertiary">
            <Link
              href="/terms"
              className="hover:text-t-secondary transition-colors no-underline"
            >
              Terms of Service
            </Link>
            <span>·</span>
            <Link
              href="/pricing"
              className="hover:text-t-secondary transition-colors no-underline"
            >
              Pricing
            </Link>
            <span>·</span>
            <Link
              href="/blog"
              className="hover:text-t-secondary transition-colors no-underline"
            >
              Blog
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
