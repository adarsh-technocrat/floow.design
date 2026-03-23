"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const CELL_COUNT = 12;
const FILL_INTERVAL_MS = 150;
const PAUSE_WHEN_FULL_MS = 600;
const PAUSE_WHEN_EMPTY_MS = 300;

function CellProgressLoader() {
  const [filledCount, setFilledCount] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setFilledCount((prev) => {
        if (prev >= CELL_COUNT) {
          setPaused(true);
          setTimeout(() => {
            setFilledCount(0);
            setPaused(true);
            setTimeout(() => setPaused(false), PAUSE_WHEN_EMPTY_MS);
          }, PAUSE_WHEN_FULL_MS);
          return prev;
        }
        return prev + 1;
      });
    }, FILL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div className="flex flex-col items-center gap-4">
      <span
        className="text-sm font-bold tracking-tight text-t-primary"
        style={{
          fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
        }}
      >
        floow<span className="text-t-secondary">.design</span>
      </span>
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: CELL_COUNT }).map((_, i) => (
          <div
            key={i}
            className="h-2 w-4 rounded-[2px] transition-colors duration-150"
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

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface">
        <CellProgressLoader />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
