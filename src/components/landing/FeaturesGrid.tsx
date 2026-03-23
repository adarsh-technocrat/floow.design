const features = [
  {
    title: "Describe your app",
    description: "Type what you want in plain English — screens, flows, style.",
    label: "Input",
  },
  {
    title: "AI generates designs",
    description:
      "Complete mobile screens with proper layout, spacing, typography.",
    label: "Design",
  },
  {
    title: "Export anywhere",
    description: "Export to Figma, AI builders, or share preview links.",
    label: "Export",
  },
  {
    title: "iOS & Android ready",
    description:
      "Pixel-perfect designs for both platforms — Material & Cupertino.",
    label: "Platforms",
  },
  {
    title: "Multi-screen flows",
    description: "Complete app flows with navigation, transitions, and state.",
    label: "Flows",
  },
  {
    title: "Custom themes",
    description: "Design with your brand colors, fonts, and design tokens.",
    label: "Theming",
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

        <div className="grid grid-cols-1 gap-px border-t border-b-secondary bg-b-secondary md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col bg-surface px-4 py-8 md:px-6 md:py-10 lg:px-8 lg:py-12"
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
            </div>
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
