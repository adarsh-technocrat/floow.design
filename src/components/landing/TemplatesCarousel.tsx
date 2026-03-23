"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  tag: string;
  screens: number;
  thumbnail: string | null;
  firstFrameHtml: string | null;
}

export function TemplatesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Landing page — no Redux store, direct fetch is appropriate
  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data: { templates?: Template[] }) => {
        if (data.templates) setTemplates(data.templates);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  if (!loading && templates.length === 0) return null;

  return (
    <section
      id="templates"
      className="scroll-mt-14 border-t border-b-secondary"
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="shrink-0 text-[11px] font-mono font-semibold uppercase tracking-wider text-t-tertiary">
          Templates
        </span>
        <span aria-hidden className="h-px min-w-8 flex-1 bg-b-secondary" />
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => scroll("left")}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-input-bg text-t-tertiary transition-colors hover:bg-surface-sunken hover:text-t-primary"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8l4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-input-bg text-t-tertiary transition-colors hover:bg-surface-sunken hover:text-t-primary"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="px-4 py-6 sm:px-5 sm:py-8">
        <h2
          className="text-2xl md:text-3xl font-semibold tracking-tight text-t-primary mb-2"
          style={{
            fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
          }}
        >
          Start from a template
        </h2>
        <p className="text-sm text-t-secondary mb-8 max-w-md">
          Every template exports production-ready Flutter code.
        </p>

        {loading ? (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[170px] sm:w-[200px] md:w-[220px] aspect-[9/16] rounded-lg bg-input-bg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth scrollbar-hide"
          >
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/app/${t.id}`}
                className="group relative flex-shrink-0 w-[170px] sm:w-[200px] md:w-[220px] no-underline"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-lg border border-b-secondary bg-input-bg shadow-sm transition-shadow hover:shadow-md">
                  {/* Frame preview */}
                  {t.thumbnail ? (
                    <img
                      alt={t.name}
                      src={t.thumbnail}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : t.firstFrameHtml ? (
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                      <iframe
                        srcDoc={t.firstFrameHtml}
                        sandbox=""
                        title={`${t.name} preview`}
                        className="h-[927px] w-[420px] origin-top-left border-none"
                        style={{
                          transform: "scale(0.523)",
                          transformOrigin: "top left",
                        }}
                        tabIndex={-1}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-[11px] font-mono text-t-tertiary">
                        {t.screens} screens
                      </span>
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded bg-btn-primary-bg/70 px-1.5 py-0.5 text-[11px] font-mono uppercase tracking-wider text-btn-primary-text backdrop-blur-sm">
                        {t.tag}
                      </span>
                      <span className="text-[11px] font-mono text-t-tertiary">
                        {t.screens} screens
                      </span>
                    </div>
                    <p className="text-xs font-medium text-t-primary">
                      {t.name}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{scrollbar-width:none}`}</style>
    </section>
  );
}
