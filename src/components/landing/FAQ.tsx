'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const faqs = [
  { q: 'What is Launchpad AI?', a: 'An AI-powered platform that turns your ideas into beautiful mobile app designs with production-ready Flutter code.' },
  { q: 'Is it free to use?', a: 'Yes. Free with a daily credit system that resets every day. Premium plans coming soon.' },
  { q: 'What platforms does the code support?', a: 'Flutter runs on iOS, Android, web, and desktop — all from one codebase.' },
  { q: 'Can I export the code directly?', a: 'Yes. Copy the generated Dart & Flutter widget code into your project. Standard patterns — StatelessWidget, StatefulWidget, Material, Cupertino.' },
  { q: 'Is the code production-ready?', a: 'Yes. Clean Dart with proper widget composition, theming, and responsive layouts.' },
  { q: 'Material and Cupertino support?', a: 'Both. Choose the design language that fits your app.' },
];

export function FAQ() {
  const [openId, setOpenId] = useState<number | null>(0);

  return (
    <section id="faq">
      <div className="border-b border-white/[0.12] px-5 py-4">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-white/30">FAQ</span>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left — heading */}
        <div className="lg:w-[340px] flex-shrink-0 p-5 lg:p-8 lg:border-r border-white/[0.12]">
          <h2
            className="text-2xl md:text-3xl font-semibold tracking-tight text-white"
            style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
          >
            Questions
          </h2>
          <p className="mt-3 text-sm text-white/30 leading-relaxed">Everything you need to know.</p>
          <a href="/pricing" className="inline-flex items-center gap-1.5 mt-5 text-[11px] font-mono font-semibold uppercase tracking-wider text-white/40 hover:text-white transition-colors no-underline">
            View pricing →
          </a>
        </div>

        {/* Right — accordion */}
        <div className="flex-1">
          {faqs.map((faq, i) => {
            const isOpen = openId === i;
            return (
              <div key={i} className="border-b border-white/[0.12] last:border-b-0">
                <button
                  onClick={() => setOpenId(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-6 px-5 lg:px-8 py-4 text-left group"
                >
                  <span className="text-sm font-medium text-white group-hover:text-white/80 transition-colors">{faq.q}</span>
                  <span className={`flex-shrink-0 h-5 w-5 flex items-center justify-center rounded border border-white/[0.08] text-white/25 transition-all duration-200 ${isOpen ? 'rotate-45 border-white/20 text-white/50' : ''}`}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 lg:px-8 pb-4 text-sm leading-relaxed text-white/30 pr-16">{faq.a}</p>
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
