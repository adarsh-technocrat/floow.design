"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/landing/Logo";

const cursors = [
  { name: "Ava", color: "#f87171", x: "15%", y: "20%", delay: 0.6 },
  { name: "Leo", color: "#60a5fa", x: "75%", y: "15%", delay: 1.0 },
  { name: "Priya", color: "#34d399", x: "65%", y: "65%", delay: 1.4 },
  { name: "Jake", color: "#fbbf24", x: "20%", y: "70%", delay: 1.8 },
  { name: "Mei", color: "#c084fc", x: "80%", y: "42%", delay: 0.8 },
  { name: "Sara", color: "#fb923c", x: "40%", y: "85%", delay: 2.0 },
];

const prompts = [
  "A fitness tracker with dark theme and weekly charts",
  "E-commerce app with product cards and cart",
  "Social media feed with stories and bottom nav",
  "Music player with album art and playlist view",
  "Food delivery app with restaurant listings",
];

function StreamingPrompt() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const text = prompts[promptIndex];
    let charIndex = 0;
    setDisplayed("");
    setIsTyping(true);

    // Type characters one by one
    const typeInterval = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayed(text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        // Pause, then move to next prompt
        setTimeout(() => {
          setPromptIndex((prev) => (prev + 1) % prompts.length);
        }, 2000);
      }
    }, 35);

    return () => clearInterval(typeInterval);
  }, [promptIndex]);

  return (
    <span className="flex-1 text-xs text-white/40 truncate">
      {displayed}
      {isTyping && <span className="inline-block w-px h-3 bg-white/40 ml-0.5 animate-pulse align-middle" />}
    </span>
  );
}

function CanvasPanel() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/[0.08]">
      {/* Dotted canvas background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Subtle center glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(255,255,255,0.02) 0%, transparent 70%)",
        }}
      />

      {/* Bottom center — prompt box */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[85%] max-w-[400px]">
        <div className="rounded-xl border border-white/[0.12] bg-[#111113]/90 backdrop-blur-xl px-3.5 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/25 flex-shrink-0">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <StreamingPrompt />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[9px] font-mono text-white/15 border border-white/[0.08] rounded px-1 py-0.5">⌘K</span>
              <div className="size-5 rounded bg-white/[0.08] flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-white/30">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated cursors */}
      {cursors.map((cursor) => (
        <motion.div
          key={cursor.name}
          className="absolute z-10"
          style={{ left: cursor.x, top: cursor.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: cursor.delay, duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
        >
          <motion.div
            animate={{
              x: [0, 12, -8, 16, -4, 0],
              y: [0, -14, 8, -10, 12, 0],
            }}
            transition={{ duration: 10 + (parseInt(cursor.name, 36) % 5), repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
              <path
                d="M1 1L1 15.5L5.5 11.5L9.5 19L12.5 17.5L8.5 10L14 9L1 1Z"
                fill={cursor.color}
                stroke="white"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            <motion.div
              className="ml-4 -mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-semibold shadow-lg whitespace-nowrap"
              style={{ backgroundColor: cursor.color, color: "#000" }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: cursor.delay + 0.3, duration: 0.3 }}
            >
              {cursor.name}
            </motion.div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-black">
      {/* Left panel — sign in form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-10 lg:hidden">
          <Logo size="lg" />
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-10 hidden lg:block">
            <Logo size="lg" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-white/50">Sign in to your account to continue</p>

          <div className="mt-8">
            <button type="button" className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.04] text-sm font-medium text-white transition-colors hover:bg-white/[0.08]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-xs text-white/30">or</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          {!magicLinkSent ? (
            <form onSubmit={(e) => { e.preventDefault(); if (email) setMagicLinkSent(true); }} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-white/50">Email address</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-sm text-white placeholder-white/25 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors" />
              </div>
              <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition-colors hover:bg-white/90">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4l6 4.5L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>
                Send Magic Link
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">Check your email</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">We sent a magic link to <span className="font-medium text-white">{email}</span><br />Click the link to sign in.</p>
              <button type="button" onClick={() => setMagicLinkSent(false)} className="mt-6 text-sm text-white/40 hover:text-white/70 transition-colors">Use a different email</button>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-white/40">Don&apos;t have an account?{" "}<Link href="/signup" className="font-medium text-white hover:text-white/80 transition-colors no-underline">Sign up</Link></p>
          <p className="mt-6 text-center text-[11px] leading-relaxed text-white/25">By continuing, you agree to our{" "}<a href="#" className="text-white/40 hover:text-white/60 no-underline">Terms of Service</a>{" "}and{" "}<a href="#" className="text-white/40 hover:text-white/60 no-underline">Privacy Policy</a></p>
        </div>
      </div>

      {/* Right panel — canvas with cursors */}
      <div className="hidden lg:block lg:w-[50%] p-3 pl-0">
        <CanvasPanel />
      </div>
    </div>
  );
}
