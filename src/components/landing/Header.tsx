'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Templates', href: '/#templates' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/#faq' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.12] bg-black/80 backdrop-blur-lg">
      <div className="flex h-14 items-center justify-between gap-4 px-5">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40 hover:text-white hover:bg-white/[0.05] rounded transition-colors no-underline font-mono"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/signin"
            className="hidden sm:inline-flex px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/50 hover:text-white transition-colors no-underline font-mono"
          >
            Sign in
          </a>
          <a
            href="/app"
            className="inline-flex h-9 items-center px-5 rounded border border-white/[0.15] bg-white text-[11px] font-semibold uppercase tracking-wider text-black hover:bg-white/90 transition-colors no-underline font-mono"
          >
            Get Started
          </a>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded text-white/60 hover:bg-white/[0.05] transition-colors md:hidden"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/[0.12] bg-black md:hidden">
          <nav className="flex flex-col px-5 py-3 gap-1">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] rounded transition-colors no-underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
