import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for floow.design — the AI-powered mobile app design platform.",
  alternates: { canonical: "https://www.floow.design/terms" },
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-t-tertiary font-mono mb-8">
            Last updated: March 24, 2026
          </p>

          <div className="prose prose-sm dark:prose-invert max-w-none text-t-secondary leading-relaxed space-y-6">
            <p>
              Welcome to floow.design. By using our AI-powered{" "}
              <Link
                href="/#features"
                className="underline hover:text-t-primary"
              >
                mobile app design platform
              </Link>
              , you agree to these Terms of Service.
            </p>

            <h2 className="text-lg font-semibold text-t-primary mt-8 mb-3">
              Use of Service
            </h2>
            <p>
              floow.design provides an AI-powered platform for designing mobile
              applications. You may use our service to create, edit, and export
              mobile app designs for personal or commercial use in accordance
              with your{" "}
              <Link href="/pricing" className="underline hover:text-t-primary">
                subscription plan
              </Link>
              .
            </p>

            <h2 className="text-lg font-semibold text-t-primary mt-8 mb-3">
              Account Responsibilities
            </h2>
            <p>
              You are responsible for maintaining the security of your account
              credentials and for all activities that occur under your account.
              You must provide accurate information when creating your account.
            </p>

            <h2 className="text-lg font-semibold text-t-primary mt-8 mb-3">
              Intellectual Property
            </h2>
            <p>
              Designs you create using floow.design belong to you. Our platform,
              including its AI models, templates, and interface, remains our
              intellectual property.
            </p>

            <h2 className="text-lg font-semibold text-t-primary mt-8 mb-3">
              Payments &amp; Subscriptions
            </h2>
            <p>
              Paid plans are billed according to the{" "}
              <Link href="/pricing" className="underline hover:text-t-primary">
                pricing page
              </Link>
              . You can cancel your subscription at any time through your
              billing settings. Refunds are handled on a case-by-case basis.
            </p>

            <h2 className="text-lg font-semibold text-t-primary mt-8 mb-3">
              Limitation of Liability
            </h2>
            <p>
              floow.design is provided &quot;as is&quot; without warranties of
              any kind. We are not liable for any damages arising from your use
              of the service.
            </p>

            <h2 className="text-lg font-semibold text-t-primary mt-8 mb-3">
              Contact
            </h2>
            <p>
              For questions about these terms, contact us at legal@floow.design.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-[11px] font-mono text-t-tertiary">
            <Link
              href="/privacy"
              className="hover:text-t-secondary transition-colors no-underline"
            >
              Privacy Policy
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
