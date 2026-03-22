"use client";

import { useState } from "react";

export function ProductDemo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section
      id="demo"
      className="scroll-mt-14 border-t border-b-secondary"
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="shrink-0 text-[11px] font-mono font-semibold uppercase tracking-wider text-t-tertiary">
          See it in action
        </span>
        <span aria-hidden className="h-px min-w-8 flex-1 bg-b-secondary" />
      </div>

      <div className="px-4 pb-12 sm:px-5 sm:pb-16 md:pb-20">
        <div className="mx-auto max-w-3xl text-center mb-8 sm:mb-10">
          <h2
            className="text-xl sm:text-2xl md:text-[40px] font-semibold tracking-tight leading-[1.1] text-t-primary"
            style={{
              fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
            }}
          >
            From prompt to production
            <br />
            <span className="text-t-secondary">in under a minute</span>
          </h2>
          <p
            className="mt-4 text-sm md:text-base text-t-secondary max-w-md mx-auto leading-relaxed"
          >
            Watch how floow.design turns a simple description into a
            fully-designed Flutter app with exportable code.
          </p>
        </div>

        {/* Video player */}
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-b-secondary bg-surface-elevated shadow-prompt-card">
            {/* Video aspect ratio container */}
            <div className="relative aspect-video bg-canvas-bg">
              {/* Dotted background behind video */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {!isPlaying ? (
                /* Placeholder with play button */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                  {/* Fake UI preview lines */}
                  <div className="flex gap-3 mb-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 w-12 sm:h-28 sm:w-16 rounded-lg sm:rounded-xl border border-b-secondary bg-surface-elevated/80 shadow-sm"
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setIsPlaying(true)}
                    className="flex items-center gap-2.5 rounded-full bg-btn-primary-bg px-6 py-3 text-sm font-semibold text-btn-primary-text shadow-lg transition-all hover:opacity-90 active:scale-95"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Watch demo
                  </button>

                  <span className="text-[10px] font-mono text-t-tertiary uppercase tracking-wider">
                    2 min
                  </span>
                </div>
              ) : (
                /* Replace with actual video embed */
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
                  <p className="text-sm text-white/60 font-mono">
                    Video coming soon
                  </p>
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-b-secondary">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-mono text-t-tertiary uppercase tracking-wider">
                  Live demo
                </span>
              </div>
              <div className="h-3 w-px bg-input-bg" />
              <span className="text-[10px] font-mono text-t-tertiary">
                Prompt → Design → Flutter code
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mx-auto mt-8 sm:mt-10 grid max-w-2xl grid-cols-3 gap-3 sm:gap-4">
          {[
            { value: "< 60s", label: "Average generation time" },
            { value: "100%", label: "Production-ready Flutter" },
            { value: "10+", label: "Screen types supported" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="text-xl md:text-2xl font-semibold text-t-primary"
                style={{
                  fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
                }}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] font-mono text-t-tertiary uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
