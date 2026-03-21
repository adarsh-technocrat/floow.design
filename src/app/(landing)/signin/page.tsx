"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

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

          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Sign in to your account to continue
          </p>

          {/* Google sign-in */}
          <div className="mt-8">
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.04] text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-xs text-white/30">or</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          {/* Magic link form */}
          {!magicLinkSent ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setMagicLinkSent(true);
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-medium text-white/50"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-sm text-white placeholder-white/25 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
                />
              </div>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition-colors hover:bg-white/90"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 4l6 4.5L14 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="1.5"
                    y="3"
                    width="13"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Send Magic Link
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    stroke="#22c55e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">
                Check your email
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                We sent a magic link to{" "}
                <span className="font-medium text-white">{email}</span>
                <br />
                Click the link to sign in.
              </p>
              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="mt-6 text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-white hover:text-white/80 transition-colors no-underline"
            >
              Sign up
            </Link>
          </p>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-white/25">
            By continuing, you agree to our{" "}
            <a href="#" className="text-white/40 hover:text-white/60 no-underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-white/40 hover:text-white/60 no-underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Right panel — video */}
      <div className="hidden relative overflow-hidden lg:flex lg:w-[50%]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source
            src="https://storage.googleapis.com/gweb-gemini-cdn/gemini/uploads/89e9004d716a7803fc7c9aab18c985af783f5a36.mp4"
            type="video/mp4"
          />
        </video>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-black/20" />
      </div>
    </div>
  );
}
