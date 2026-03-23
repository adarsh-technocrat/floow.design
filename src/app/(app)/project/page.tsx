"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import http from "@/lib/http";

export default function NewProjectPage() {
  const router = useRouter();

  useEffect(() => {
    http.post<{ id?: string }>("/api/projects", { name: "Untitled Project" })
      .then(({ data }) => {
        if (data.id) {
          router.replace(`/project/${data.id}`);
        }
      })
      .catch(() => {
        router.replace("/dashboard");
      });
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-canvas-bg text-t-primary">
      <div className="flex items-center gap-2 text-sm text-t-secondary">
        <div className="size-2 rounded-full bg-t-tertiary animate-pulse" />
        Creating project...
      </div>
    </div>
  );
}
