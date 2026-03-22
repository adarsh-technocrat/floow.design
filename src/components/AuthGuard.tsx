"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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
        <div className="flex items-center gap-2 text-sm text-t-secondary">
          <div className="size-2 rounded-full bg-t-tertiary animate-pulse" />
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
