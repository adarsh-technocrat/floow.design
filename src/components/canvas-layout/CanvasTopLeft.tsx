"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProjects, createProject } from "@/store/slices/projectsSlice";
import { useAuth } from "@/contexts/AuthContext";

export function CanvasTopLeft() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const currentProjectId = (params?.id ?? params?.projectId) as
    | string
    | undefined;
  const projects = useAppSelector((s) => s.projects.list);
  const listLoading = useAppSelector((s) => s.projects.listLoading);
  const currentProjectName = useAppSelector((s) => {
    const found = s.projects.list.find((p) => p.id === currentProjectId);
    return found?.name ?? s.project.projectName ?? "Untitled Project";
  });

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Background refresh when dropdown opens — data is already prefetched by ProjectLoader
  useEffect(() => {
    if (open && user) {
      dispatch(fetchProjects());
    }
  }, [open, user, dispatch]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSwitch = (projectId: string) => {
    setOpen(false);
    if (projectId !== currentProjectId) {
      router.push(`/project/${projectId}`);
    }
  };

  const handleNewProject = async () => {
    setOpen(false);
    const result = await dispatch(createProject("Untitled Project")).unwrap();
    if (result.id) {
      router.push(`/project/${result.id}`);
    }
  };

  // Truncate project name for display
  const displayName =
    currentProjectName.length > 24
      ? currentProjectName.slice(0, 24) + "…"
      : currentProjectName;

  return (
    <div className="absolute left-0 top-0 z-10 flex h-12 items-center gap-3 px-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 no-underline"
        title="Back to dashboard"
      >
        <span
          className="text-sm font-bold tracking-tight text-t-primary"
          style={{
            fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
          }}
        >
          floow<span className="text-t-secondary">.design</span>
        </span>
      </Link>

      <div className="h-4 w-px bg-b-primary" />

      {/* Project switcher */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-t-secondary hover:text-t-primary hover:bg-input-bg transition-colors"
        >
          <span>{displayName}</span>
          <ChevronDown
            className={`size-3.5 text-t-tertiary transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 w-[280px] overflow-hidden rounded-xl border border-b-secondary bg-surface-elevated shadow-lg backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-b-secondary">
              <span className="text-xs font-medium text-t-tertiary uppercase tracking-wider">
                Projects
              </span>
              <button
                onClick={handleNewProject}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-t-secondary hover:bg-input-bg hover:text-t-primary transition-colors"
              >
                <Plus className="size-3" />
                New
              </button>
            </div>

            {/* Project list */}
            <div className="max-h-[320px] overflow-y-auto py-1">
              {listLoading && projects.length === 0 ? (
                <div className="space-y-1 px-3 py-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <div className="size-8 shrink-0 animate-pulse rounded-md bg-t-tertiary/15" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-24 animate-pulse rounded bg-t-tertiary/15" />
                        <div className="h-2.5 w-14 animate-pulse rounded bg-t-tertiary/10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-t-tertiary">
                  No projects
                </p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSwitch(project.id)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-input-bg ${
                      project.id === currentProjectId ? "bg-input-bg/60" : ""
                    }`}
                  >
                    <div className="size-8 shrink-0 overflow-hidden rounded-md border border-b-secondary bg-input-bg">
                      <div className="flex size-full items-center justify-center text-[8px] text-t-tertiary">
                        {project.screens}s
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] font-medium truncate ${
                          project.id === currentProjectId
                            ? "text-t-primary"
                            : "text-t-secondary"
                        }`}
                      >
                        {project.name}
                      </p>
                      <p className="text-[11px] text-t-tertiary">
                        {project.screens} screens
                      </p>
                    </div>
                    {project.id === currentProjectId && (
                      <div className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-b-secondary px-3 py-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-t-tertiary hover:text-t-secondary transition-colors no-underline"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
