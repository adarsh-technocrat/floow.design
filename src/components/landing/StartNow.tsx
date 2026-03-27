import Image from "next/image";
import Link from "next/link";

export function StartNow() {
  return (
    <section
      id="start-now"
      className="scroll-mt-14 border-t border-b-secondary"
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="shrink-0 text-[11px] font-mono font-semibold uppercase tracking-wider text-t-tertiary">
          Get Started
        </span>
        <span aria-hidden className="h-px min-w-8 flex-1 bg-b-secondary" />
      </div>

      <div className="relative mx-5 flex min-h-[min(88vw,520px)] items-center overflow-hidden border border-b-secondary bg-surface sm:min-h-[420px] md:min-h-[460px]">
        <Image
          src="/landing/get-started-bg.png"
          alt=""
          fill
          className="pointer-events-none object-contain object-bottom-right"
          sizes="(max-width: 1280px) calc(100vw - 2.5rem), 1200px"
        />

        <div className="relative z-10 w-full px-4 py-14 sm:px-5 sm:py-20 md:py-28">
          <div className="mx-auto max-w-xl text-center">
            <h2
              className="text-2xl sm:text-3xl md:text-[44px] font-semibold tracking-tight leading-[1.1] text-t-primary"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Ready to design your
              <br />
              <span
                className="text-t-secondary font-normal"
                style={{
                  fontFamily: "var(--font-pixel), 'Silkscreen', monospace",
                }}
              >
                next mobile app?
              </span>
            </h2>

            <p className="mt-5 text-sm md:text-base text-t-secondary max-w-sm mx-auto leading-relaxed">
              Join thousands of designers and teams creating beautiful mobile
              apps with floow.design.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/project"
                className="inline-flex h-10 items-center px-6 rounded border-0 bg-btn-primary-bg text-[11px] font-semibold uppercase tracking-wider text-btn-primary-text hover:opacity-90 transition-colors no-underline font-mono"
              >
                Start designing free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-10 items-center px-6 rounded border border-b-strong bg-surface-elevated text-[11px] font-semibold uppercase tracking-wider text-t-primary shadow-sm transition-colors hover:bg-surface-sunken dark:border-white/25 dark:shadow-[0_1px_2px_rgba(0,0,0,0.45)] dark:hover:bg-white/6 no-underline font-mono"
              >
                View pricing
              </Link>
            </div>

            <p className="mt-6 text-[11px] font-mono text-t-tertiary uppercase tracking-wider">
              Free forever · No credit card
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
