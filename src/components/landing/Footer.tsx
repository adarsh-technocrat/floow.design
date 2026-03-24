"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { PromptCTA } from "./PromptCTA";

const links = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Templates", href: "/#templates" },
    { label: "Pricing", href: "/pricing" },
    { label: "Get Started", href: "/project" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/#faq" },
  ],
  "Use Cases": [
    { label: "AI App Design", href: "/blog" },
    { label: "AI Wireframe Generator", href: "/#features" },
    { label: "Figma AI Alternative", href: "/#templates" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-b-secondary bg-surface px-5 pt-8">
      {/* Prompt CTA */}
      <div className="mx-auto max-w-xl py-10">
        <p className="mb-3 text-center text-sm font-medium text-t-secondary">
          Have an app idea? Start building now.
        </p>
        <PromptCTA
          variant="compact"
          placeholder="Describe your app idea and hit Generate..."
        />
      </div>

      <div className="py-8 sm:py-12">
        <div className="flex flex-col gap-8 sm:gap-10 md:flex-row md:justify-between">
          <div className="max-w-[220px]">
            <Logo />
            <p className="mt-3 text-xs text-t-tertiary leading-relaxed">
              AI-powered mobile app design.
            </p>
            {/* Status */}
            <div className="mt-4 flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              <span className="text-[11px] font-mono text-t-tertiary uppercase tracking-wider">
                All systems operational
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {Object.entries(links).map(([group, items]) => (
              <div key={group}>
                <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-t-tertiary mb-3">
                  {group}
                </p>
                <ul className="flex flex-col gap-2 list-none m-0 p-0">
                  {items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-xs text-t-tertiary hover:text-t-primary transition-colors no-underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between pt-6">
          <p className="text-[11px] text-t-tertiary">
            &copy; 2026 floow.design
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              className="text-[11px] font-mono text-t-tertiary hover:text-t-secondary transition-colors no-underline"
            >
              Read our blog →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
