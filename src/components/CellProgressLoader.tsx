"use client";

import { useEffect, useState } from "react";

const CELL_COUNT = 12;
const FILL_INTERVAL_MS = 150;

export function CellProgressLoader() {
  const [filledCount, setFilledCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFilledCount((prev) => (prev >= CELL_COUNT ? 0 : prev + 1));
    }, FILL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      <span
        className="text-2xl font-bold tracking-tight text-t-primary"
        style={{
          fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
        }}
      >
        floow<span className="text-t-secondary">.design</span>
      </span>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: CELL_COUNT }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 w-7 rounded transition-colors duration-150"
            style={{
              backgroundColor:
                i < filledCount
                  ? "var(--text-primary)"
                  : "var(--border-secondary)",
              opacity: i < filledCount ? 0.7 + (i / CELL_COUNT) * 0.3 : 0.35,
            }}
          />
        ))}
      </div>
    </div>
  );
}
