"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const faqs = [
  {
    q: "What is floow.design?",
    a: "An AI-powered platform that turns your ideas into beautiful, high-fidelity mobile app designs in seconds.",
  },
  {
    q: "Is it free to use?",
    a: "Yes. Free with a daily credit system that resets every day. Premium plans available for more credits.",
  },
  {
    q: "What platforms can I design for?",
    a: "Design for iOS and Android — with support for both Material and Cupertino design languages.",
  },
  {
    q: "Can I export my designs?",
    a: "Yes. Export to Figma, share preview links, or export to AI builders to continue building.",
  },
  {
    q: "Are the designs high-fidelity?",
    a: "Yes. Pixel-perfect layouts with proper spacing, typography, theming, and responsive design.",
  },
  {
    q: "Material and Cupertino support?",
    a: "Both. Choose the design language that fits your app.",
  },
];

export function FAQ() {
  const [openId, setOpenId] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-14 border-t border-b-secondary">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="shrink-0 text-[11px] font-mono font-semibold uppercase tracking-wider text-t-tertiary">
          FAQ
        </span>
        <span aria-hidden className="h-px min-w-8 flex-1 bg-b-secondary" />
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left — heading */}
        <div className="flex-shrink-0 border-b border-b-secondary p-4 sm:p-5 lg:w-[340px] lg:border-b-0 lg:border-r lg:border-b-secondary lg:p-8">
          <h2
            className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-t-primary"
            style={{
              fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
            }}
          >
            Questions
          </h2>
          <p className="mt-3 text-sm text-t-tertiary leading-relaxed">
            Everything you need to know.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-1.5 mt-5 text-[11px] font-mono font-semibold uppercase tracking-wider text-t-secondary hover:text-t-primary transition-colors no-underline"
          >
            View pricing →
          </a>
        </div>

        {/* Right — accordion */}
        <div className="flex-1">
          {faqs.map((faq, i) => {
            const isOpen = openId === i;
            return (
              <div key={i} className="px-2 py-1 lg:px-4">
                <button
                  onClick={() => setOpenId(isOpen ? null : i)}
                  className="group flex w-full cursor-pointer items-center justify-between gap-6 rounded-xl px-3 py-4 text-left transition-colors hover:bg-input-bg/80 lg:px-5"
                >
                  <span className="text-sm font-medium text-t-primary group-hover:text-t-primary transition-colors">
                    {faq.q}
                  </span>
                  <span
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-input-bg text-t-tertiary transition-all duration-200 ${isOpen ? "rotate-45 text-t-secondary" : ""}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 3v10M3 8h10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-3 pb-4 pr-12 text-sm leading-relaxed text-t-tertiary lg:px-5 lg:pr-16">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
