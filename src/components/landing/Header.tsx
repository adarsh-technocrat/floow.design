"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggleCompact } from "@/components/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Templates", href: "/#templates" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/#faq" },
] as const;

function isNavLinkActive(
  href: string,
  pathname: string,
  hash: string,
): boolean {
  if (href === "/pricing") return pathname === "/pricing";
  if (href === "/blog")
    return pathname === "/blog" || pathname.startsWith("/blog/");
  if (href.startsWith("/#")) {
    const expected = href.slice(1);
    return pathname === "/" && hash === expected;
  }
  return false;
}

const navLinkBaseClass =
  "px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded transition-colors no-underline font-mono";
const navLinkInactiveClass =
  "text-t-secondary hover:text-t-primary hover:bg-input-bg";
const navLinkActiveClass = "text-t-primary bg-input-bg";

const mobileNavLinkBaseClass =
  "px-3 py-2.5 text-sm font-medium rounded transition-colors no-underline";
const mobileNavLinkInactiveClass =
  "text-t-secondary hover:text-t-primary hover:bg-input-bg";
const mobileNavLinkActiveClass = "text-t-primary bg-input-bg";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hash, setHash] = useState("");
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    setHash(typeof window !== "undefined" ? window.location.hash : "");
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-b-secondary bg-surface/80 backdrop-blur-lg">
      <div className="flex h-14 items-center justify-between gap-4 px-5">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isNavLinkActive(link.href, pathname, hash);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`${navLinkBaseClass} ${active ? navLinkActiveClass : navLinkInactiveClass}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggleCompact />
          {loading ? null : user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-t-secondary hover:text-t-primary transition-colors no-underline font-mono"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex overflow-hidden rounded-full ring-2 ring-black/[0.06] dark:ring-white/10"
              >
                <Avatar
                  src={user.photoURL}
                  email={user.email}
                  name={user.displayName}
                  size={32}
                />
              </Link>
            </>
          ) : (
            <>
              <a
                href="/signin"
                className="hidden sm:inline-flex px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-t-secondary hover:text-t-primary transition-colors no-underline font-mono"
              >
                Sign in
              </a>
              <a
                href="/project"
                className="inline-flex h-9 items-center px-5 rounded border-0 bg-btn-primary-bg text-[11px] font-semibold uppercase tracking-wider text-btn-primary-text hover:opacity-90 transition-colors no-underline font-mono"
              >
                Get Started
              </a>
            </>
          )}
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded text-t-secondary hover:bg-input-bg transition-colors md:hidden"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 5L15 15M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 6H17M3 10H17M3 14H17"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="bg-surface md:hidden">
          <nav className="flex flex-col px-5 py-3 gap-1">
            {navLinks.map((link) => {
              const active = isNavLinkActive(link.href, pathname, hash);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`${mobileNavLinkBaseClass} ${active ? mobileNavLinkActiveClass : mobileNavLinkInactiveClass}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
