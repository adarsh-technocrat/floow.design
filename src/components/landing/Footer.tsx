"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { PromptCTA } from "./PromptCTA";

const links = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Templates", href: "/#templates" },
    { label: "Pricing", href: "/pricing" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/#faq" },
    { label: "Docs", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
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
              Design to Flutter code, powered by AI.
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
            &copy; 2026 Launchpad AI
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="text-t-tertiary hover:text-t-secondary transition-colors"
              aria-label="Twitter"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="#"
              className="text-t-tertiary hover:text-t-secondary transition-colors"
              aria-label="GitHub"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
