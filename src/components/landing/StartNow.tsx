export function StartNow() {
  return (
    <section id="start-now" className="border-b border-white/[0.12]">
      <div className="border-b border-white/[0.12] px-5 py-4">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-white/30">Get Started</span>
      </div>

      <div className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-xl text-center">
          <h2
            className="text-3xl md:text-[44px] font-semibold tracking-tight leading-[1.1] text-white"
            style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
          >
            Ready to build your
            <br />
            <span className="text-white/35">next app?</span>
          </h2>

          <p className="mt-5 text-sm md:text-base text-white/35 max-w-sm mx-auto leading-relaxed">
            Join thousands of developers shipping Flutter apps faster with Launchpad AI.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/app"
              className="inline-flex h-10 items-center px-6 rounded border border-white/[0.15] bg-white text-[11px] font-semibold uppercase tracking-wider text-black hover:bg-white/90 transition-colors no-underline font-mono"
            >
              Start building free
            </a>
            <a
              href="/pricing"
              className="inline-flex h-10 items-center px-6 rounded border border-white/[0.08] text-[11px] font-semibold uppercase tracking-wider text-white/40 hover:text-white hover:border-white/20 transition-colors no-underline font-mono"
            >
              View pricing
            </a>
          </div>

          <p className="mt-6 text-[11px] font-mono text-white/20 uppercase tracking-wider">Free forever · No credit card</p>
        </div>
      </div>
    </section>
  );
}
