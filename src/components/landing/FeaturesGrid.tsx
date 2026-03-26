import Link from "next/link";

const features = [
  {
    title: "Describe your app",
    description: "Type what you want in plain English — screens, flows, style.",
    label: "Input",
    slug: "ai-mobile-app-design",
  },
  {
    title: "AI generates designs",
    description:
      "Complete mobile screens with proper layout, spacing, typography.",
    label: "Design",
    slug: "ai-screen-generator",
  },
  {
    title: "Export anywhere",
    description: "Export to Figma, AI builders, or share preview links.",
    label: "Export",
    slug: "export-to-figma",
  },
  {
    title: "iOS & Android ready",
    description:
      "Pixel-perfect designs for both platforms — Material & Cupertino.",
    label: "Platforms",
    slug: "ios-android-design",
  },
  {
    title: "Multi-screen flows",
    description: "Complete app flows with navigation, transitions, and state.",
    label: "Flows",
    slug: "multi-screen-app-flows",
  },
  {
    title: "Custom themes",
    description: "Design with your brand colors, fonts, and design tokens.",
    label: "Theming",
    slug: "custom-design-themes",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="scroll-mt-14 border-t border-b-secondary">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="shrink-0 text-[11px] font-mono font-semibold uppercase tracking-wider text-t-tertiary">
          Features
        </span>
        <span aria-hidden className="h-px min-w-8 flex-1 bg-b-secondary" />
        <Link
          href="/features"
          className="shrink-0 text-[11px] font-mono font-medium text-t-tertiary hover:text-t-secondary transition-colors no-underline"
        >
          View all →
        </Link>
      </div>

      {/* One frame: intro + feature grid + stats share the same width so column lines line up; avoids double borders between blocks */}
      <div className="mx-5 border border-b-secondary">
        <div className="px-5 pb-8 pt-8">
          <h2
            className="mb-3 text-2xl font-semibold tracking-tight text-t-primary md:text-3xl"
            style={{
              fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
            }}
          >
            Everything you need to build
          </h2>
          <p className="max-w-md text-sm text-t-secondary">
            From idea to polished mobile design — create, iterate, and export in
            one place.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px border-t border-b-secondary bg-b-secondary md:grid-cols-2 lg:grid-cols-3 contain-layout">
          {features.map((f) => (
            <Link
              key={f.title}
              href={`/features/${f.slug}`}
              className="group flex flex-col bg-surface px-4 py-8 md:px-6 md:py-10 lg:px-8 lg:py-12 transition-colors hover:bg-input-bg/80 no-underline min-h-[160px] md:min-h-[180px]"
            >
              <span className="mb-3 text-[11px] font-mono font-semibold uppercase tracking-widest text-t-tertiary">
                {f.label}
              </span>
              <h3 className="mb-1.5 text-base font-semibold text-t-primary">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-t-secondary">
                {f.description}
              </p>
              <span className="mt-4 text-[11px] font-mono text-t-tertiary group-hover:text-t-secondary transition-colors">
                Learn more →
              </span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-px border-t border-b-secondary bg-b-secondary">
          {[
            { value: "10x", label: "Faster than manual" },
            { value: "100+", label: "Components supported" },
            { value: "50k+", label: "Apps designed" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center bg-surface px-2 py-8 md:py-10"
            >
              <span
                className="text-xl md:text-2xl font-bold text-t-primary"
                style={{
                  fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
                }}
              >
                {s.value}
              </span>
              <span className="mt-1 text-[11px] font-mono uppercase tracking-wider text-t-tertiary">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
