import { Avatar } from "@/components/ui/Avatar";

// Row 1: 2 + 1 = 3  |  Row 2: 1 + 2 = 3  |  Row 3: 1 + 1 + 1 = 3
const testimonials = [
  {
    quote:
      "I described a fitness app and had pixel-perfect screens in 30 seconds. The designs were spot-on. This is genuinely magical.",
    name: "Sarah Chen",
    role: "Mobile Developer",
    company: "Freelance",
    email: "sarah@demo.com",
    colSpan: 2,
    highlight: true,
  },
  {
    quote:
      "We used floow.design to prototype 3 app concepts in a single afternoon. What used to take our design team a week now takes minutes.",
    name: "Marcus Rivera",
    role: "Product Manager",
    company: "Fintech Startup",
    email: "marcus@demo.com",
    colSpan: 1,
  },
  {
    quote:
      "I'm a product manager with no design skills. floow.design let me create professional mobile mockups in minutes instead of waiting weeks.",
    name: "Jake Morrison",
    role: "Product Manager",
    company: "Cloud Systems Co",
    email: "jake@demo.com",
    colSpan: 1,
    highlight: true,
  },
  {
    quote:
      "We've integrated it into our rapid prototyping pipeline. Clients love seeing real app screens instead of wireframes in pitch meetings.",
    name: "Mei Zhang",
    role: "CTO",
    company: "AppForge Labs",
    email: "mei@demo.com",
    colSpan: 2,
  },
  {
    quote:
      "The quality of the generated designs blew me away. It understands layout, spacing, and visual hierarchy better than most junior designers.",
    name: "Priya Sharma",
    role: "Design Lead",
    company: "Studio Atlas",
    email: "priya@demo.com",
    colSpan: 1,
  },
  {
    quote:
      "The dark mode and glassmorphism prompts produce results that look like they came from a $50k design agency. Incredible value.",
    name: "Alex Petrov",
    role: "Indie Developer",
    company: "Self-employed",
    email: "alex@demo.com",
    colSpan: 1,
  },
  {
    quote:
      "Went from zero to a fully functional prototype in under 5 minutes. My investors were blown away at the demo.",
    name: "Lena Okafor",
    role: "Founder",
    company: "NovaPay",
    email: "lena@demo.com",
    colSpan: 1,
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="scroll-mt-14 border-t border-b-secondary"
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="shrink-0 text-[11px] font-mono font-semibold uppercase tracking-wider text-t-tertiary">
          What people say
        </span>
        <span aria-hidden className="h-px min-w-8 flex-1 bg-b-secondary" />
      </div>

      <div className="px-4 pb-12 sm:px-5 sm:pb-16 md:pb-20">
        <div className="mx-auto max-w-2xl text-center mb-8 sm:mb-12">
          <h2
            className="text-xl sm:text-2xl md:text-[40px] font-semibold tracking-tight leading-[1.1] text-t-primary"
            style={{
              fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
            }}
          >
            Loved by developers
            <br />
            <span className="text-t-secondary">and designers</span>
          </h2>
        </div>

        {/* Bento grid */}
        <div className="mx-auto max-w-4xl grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className={`group relative overflow-hidden rounded-2xl border border-b-secondary p-6 transition-colors ${
                t.colSpan === 2
                  ? "sm:col-span-2 md:col-span-2"
                  : "md:col-span-1"
              } ${
                t.highlight
                  ? "bg-btn-primary-bg text-btn-primary-text"
                  : "bg-surface-elevated"
              }`}
            >
              {/* Subtle grid pattern on highlighted cards */}
              {t.highlight && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, currentColor 1px, transparent 1px),
                      linear-gradient(to bottom, currentColor 1px, transparent 1px)
                    `,
                    backgroundSize: "32px 32px",
                  }}
                />
              )}

              {/* Stars */}
              <div className="relative flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, si) => (
                  <svg
                    key={si}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={
                      t.highlight ? "text-amber-300" : "text-amber-400"
                    }
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>

              <p
                className={`relative text-sm leading-relaxed ${
                  t.highlight ? "text-btn-primary-text/80" : "text-t-secondary"
                } ${t.colSpan === 2 ? "md:text-base" : ""}`}
              >
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="relative mt-5 flex items-center gap-3 pt-4 border-t border-current/10">
                <Avatar email={t.email} name={t.name} size={36} />
                <div>
                  <p
                    className={`text-xs font-semibold ${
                      t.highlight ? "text-btn-primary-text" : "text-t-primary"
                    }`}
                  >
                    {t.name}
                  </p>
                  <p
                    className={`text-[11px] ${
                      t.highlight
                        ? "text-btn-primary-text/60"
                        : "text-t-tertiary"
                    }`}
                  >
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
