import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = { sm: "text-base", md: "text-lg", lg: "text-xl" }[size];

  return (
    <Link href="/" className="select-none no-underline flex items-center gap-2">
      <span
        className={`${textSize} font-bold tracking-tight text-white`}
        style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
      >
        launchpad<span className="text-white/40">.ai</span>
      </span>
    </Link>
  );
}
