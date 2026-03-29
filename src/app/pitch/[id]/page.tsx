"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  MessageCircle,
  Send,
  Tv,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast, Toaster } from "sonner";
import {
  extractBodyContent,
  injectFrameScripts,
  looksLikeMalformedFrameContent,
  resolveVariant,
  truncatePartialHtml,
  wrapScreenBody,
  type ThemeVariantMap,
} from "@/lib/screen-utils";

const DEVICE_W = 390;
const DEVICE_H = 844;
const PREVIEW_SCALE = 0.5;
const PREVIEW_HEIGHT = Math.ceil(DEVICE_H * PREVIEW_SCALE) + 56;
const SLOT_COUNT = 3;

interface PitchFrame {
  id: string;
  label: string;
  html: string;
}

interface PitchTheme {
  id: string;
  name: string;
  variants: ThemeVariantMap;
}

interface SlotState {
  themeId: string | null;
  variantName: string;
  description: string;
  hidden: boolean;
}

function useThemedHtml(
  frameHtml: string | undefined,
  theme: PitchTheme | undefined,
  variantName: string,
): string {
  return useMemo(() => {
    if (!frameHtml) return "";
    const safeDoc = truncatePartialHtml(frameHtml);
    if (!safeDoc || looksLikeMalformedFrameContent(safeDoc)) return "";
    if (!theme) return injectFrameScripts(safeDoc);

    const body = extractBodyContent(frameHtml);
    if (!body) return "";
    const vars = resolveVariant(theme.variants, variantName);
    const wrapped = wrapScreenBody(body, vars);
    const safeWrapped = truncatePartialHtml(wrapped);
    if (!safeWrapped || looksLikeMalformedFrameContent(safeWrapped)) return "";
    return injectFrameScripts(safeWrapped);
  }, [frameHtml, theme, variantName]);
}

function getScreenTransform(count: number, i: number) {
  const rotation =
    count >= 3 ? ([-4, 0, 4][i] ?? 0) : count === 2 ? ([-3, 3][i] ?? 0) : 0;
  const translateY = count >= 3 ? (i === 1 ? -10 : 6) : 0;
  const zIndex = count >= 3 && i === 1 ? 2 : 1;
  return { rotation, translateY, zIndex };
}

function ScreenPreview({
  html,
  label,
  rotation,
  translateY,
  zIndex,
  variantName = "light",
}: {
  html: string;
  label: string;
  rotation: number;
  translateY: number;
  zIndex: number;
  variantName?: string;
}) {
  return (
    <div
      className="relative shrink-0"
      style={{
        transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
        zIndex,
      }}
    >
      <div
        className={`overflow-hidden rounded-xl border shadow-md ${variantName.includes("dark") ? "border-zinc-700/40 bg-zinc-900" : "border-zinc-200/40 bg-white"}`}
        style={{
          width: DEVICE_W * PREVIEW_SCALE,
          height: DEVICE_H * PREVIEW_SCALE,
        }}
      >
        {html ? (
          <iframe
            title={label}
            sandbox="allow-scripts allow-same-origin"
            srcDoc={html}
            className="pointer-events-none border-0"
            tabIndex={-1}
            style={{
              width: DEVICE_W,
              height: DEVICE_H,
              transform: `scale(${PREVIEW_SCALE})`,
              transformOrigin: "top left",
              colorScheme: variantName.includes("dark") ? "dark" : "light",
            }}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-zinc-100 text-[10px] font-mono text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
            No preview
          </div>
        )}
      </div>
    </div>
  );
}

interface PitchComment {
  id: string;
  slotIndex: number;
  author: string;
  body: string;
  createdAt: string;
}

function CommentSection({
  projectId,
  slotIndex,
  comments,
  onCommentAdded,
}: {
  projectId: string;
  slotIndex: number;
  comments: PitchComment[];
  onCommentAdded: (c: PitchComment) => void;
}) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const slotComments = comments.filter((c) => c.slotIndex === slotIndex);

  const handleSubmit = async () => {
    if (!body.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pitch/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotIndex,
          author: user.displayName || user.email || "Anonymous",
          body: body.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      onCommentAdded(data.comment);
      setBody("");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
        <MessageCircle className="size-3.5" />
        Feedback ({slotComments.length})
      </p>

      {slotComments.map((c) => (
        <div
          key={c.id}
          className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50"
        >
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">
              {c.author}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {new Date(c.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            {c.body}
          </p>
        </div>
      ))}

      {user ? (
        <div className="flex gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave feedback…"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            className="flex-1 resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            disabled={!body.trim() || submitting}
            onClick={() => void handleSubmit()}
            className="flex shrink-0 items-center justify-center rounded-lg bg-zinc-900 px-3 text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
          >
            <Send className="size-4" />
          </button>
        </div>
      ) : (
        <Link
          href="/signin"
          className="text-[12px] text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Sign in to leave feedback
        </Link>
      )}
    </div>
  );
}

function ConceptColumn({
  index,
  slot,
  themes,
  frames,
  onUpdate,
  onToggleHidden,
  viewOnly,
  projectId,
  comments,
  onCommentAdded,
}: {
  index: number;
  slot: SlotState;
  themes: PitchTheme[];
  frames: PitchFrame[];
  onUpdate: (index: number, changes: Partial<SlotState>) => void;
  onToggleHidden: (index: number) => void;
  viewOnly: boolean;
  projectId: string;
  comments: PitchComment[];
  onCommentAdded: (c: PitchComment) => void;
}) {
  const label = `Concept ${index + 1}`;
  const theme = slot.themeId
    ? themes.find((t) => t.id === slot.themeId)
    : undefined;
  const variant =
    theme && Object.keys(theme.variants).includes(slot.variantName)
      ? slot.variantName
      : theme
        ? (Object.keys(theme.variants)[0] ?? "light")
        : "light";
  const variantNames = theme ? Object.keys(theme.variants) : [];

  const html0 = useThemedHtml(frames[0]?.html, theme, variant);
  const html1 = useThemedHtml(frames[1]?.html, theme, variant);
  const html2 = useThemedHtml(frames[2]?.html, theme, variant);
  const previewHtmlList = [html0, html1, html2].slice(0, frames.length);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div
        className={`group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 ${
          slot.hidden ? "opacity-50" : ""
        }`}
      >
        <div
          className="relative flex w-full items-end justify-center overflow-hidden border-b border-zinc-100 bg-zinc-50 px-4 pt-6 dark:border-zinc-800 dark:bg-zinc-950"
          style={{
            height: PREVIEW_HEIGHT,
            backgroundImage:
              "radial-gradient(rgba(0,0,0,0.08) 0.65px, transparent 0.65px)",
            backgroundSize: "14px 14px",
            gap: frames.length >= 3 ? "10px" : "12px",
          }}
        >
          {slot.hidden ? (
            <div className="mb-4 flex items-center justify-center rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-[12px] font-mono text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
              Hidden
            </div>
          ) : frames.length === 0 ? (
            <div className="mb-4 text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
              No screens yet
            </div>
          ) : (
            previewHtmlList.map((html, i) => {
              const { rotation, translateY, zIndex } = getScreenTransform(
                previewHtmlList.length,
                i,
              );
              return (
                <ScreenPreview
                  key={frames[i]?.id ?? i}
                  html={html}
                  label={frames[i]?.label ?? `Screen ${i + 1}`}
                  rotation={rotation}
                  translateY={translateY}
                  zIndex={zIndex}
                  variantName={variant}
                />
              );
            })
          )}
        </div>
      </div>

      {viewOnly ? (
        <>
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
              {label}
              {theme && (
                <span className="ml-2 normal-case tracking-normal font-medium text-zinc-600 dark:text-zinc-300">
                  — {theme.name}
                  {variant !== "light" ? ` (${variant})` : ""}
                </span>
              )}
            </p>
            {slot.description && (
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-200">
                {slot.description}
              </p>
            )}
          </div>
          <CommentSection
            projectId={projectId}
            slotIndex={index}
            comments={comments}
            onCommentAdded={onCommentAdded}
          />
        </>
      ) : (
        <>
          <div className="flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex min-w-0 flex-1 flex-col sm:flex-row">
              <div className="relative min-w-0 flex-1 border-b border-zinc-100 sm:border-b-0 sm:border-r dark:border-zinc-800">
                <span className="pointer-events-none absolute left-3 top-1/2 z-[1] hidden -translate-y-1/2 text-[11px] font-medium text-zinc-400 sm:block">
                  {label}
                </span>
                <select
                  disabled={themes.length === 0}
                  value={slot.themeId ?? ""}
                  onChange={(e) =>
                    onUpdate(index, { themeId: e.target.value || null })
                  }
                  className="h-11 w-full cursor-pointer appearance-none bg-transparent py-2 pl-3 pr-9 text-[13px] font-medium text-zinc-800 outline-none disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-100 sm:pl-22"
                  aria-label={`${label} theme`}
                >
                  <option value="">
                    {themes.length > 0 ? "Select theme…" : "No themes"}
                  </option>
                  {themes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              </div>
              <div className="relative min-w-28 shrink-0">
                <select
                  disabled={themes.length === 0 || !theme}
                  value={
                    variantNames.includes(slot.variantName)
                      ? slot.variantName
                      : (variantNames[0] ?? "light")
                  }
                  onChange={(e) =>
                    onUpdate(index, { variantName: e.target.value })
                  }
                  className="h-11 w-full cursor-pointer appearance-none bg-transparent py-2 pl-3 pr-9 text-[12px] font-medium text-zinc-600 outline-none disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-300"
                  aria-label={`${label} variant`}
                >
                  {variantNames.length === 0 ? (
                    <option value="">—</option>
                  ) : (
                    variantNames.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleHidden(index)}
              className="flex w-11 shrink-0 items-center justify-center border-l border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              title={slot.hidden ? "Show concept" : "Hide concept"}
            >
              {slot.hidden ? (
                <EyeOff className="size-[18px]" strokeWidth={1.75} />
              ) : (
                <Eye className="size-[18px]" strokeWidth={1.75} />
              )}
            </button>
          </div>
          <textarea
            value={slot.description}
            onChange={(e) => onUpdate(index, { description: e.target.value })}
            placeholder="Add a description…"
            rows={3}
            className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-800 placeholder:text-zinc-400 outline-none transition-shadow focus:border-zinc-300 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
          />
        </>
      )}
    </div>
  );
}

function PitchPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.id as string;
  const viewOnly = searchParams.get("view") === "1";

  const [projectName, setProjectName] = useState<string | null>(null);
  const [frames, setFrames] = useState<PitchFrame[]>([]);
  const [themes, setThemes] = useState<PitchTheme[]>([]);
  const [comments, setComments] = useState<PitchComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotState[]>(
    Array.from({ length: SLOT_COUNT }, () => ({
      themeId: null,
      variantName: "light",
      description: "",
      hidden: false,
    })),
  );

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetch(`/api/pitch/${projectId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Project not found");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setProjectName(data.name ?? "Untitled Project");
        setFrames(data.frames ?? []);
        setThemes(data.themes ?? []);
        if (Array.isArray(data.slots) && data.slots.length === SLOT_COUNT) {
          setSlots(data.slots);
        }
        setComments(data.comments ?? []);
        initialLoadDone.current = true;
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const persistSlots = useCallback(
    (updated: SlotState[]) => {
      if (!projectId || !initialLoadDone.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void fetch(`/api/pitch/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slots: updated }),
        });
      }, 800);
    },
    [projectId],
  );

  const updateSlot = (index: number, changes: Partial<SlotState>) => {
    setSlots((prev) => {
      const updated = prev.map((s, i) =>
        i === index ? { ...s, ...changes } : s,
      );
      persistSlots(updated);
      return updated;
    });
  };

  const toggleHidden = (index: number) => {
    setSlots((prev) => {
      const updated = prev.map((s, i) =>
        i === index ? { ...s, hidden: !s.hidden } : s,
      );
      persistSlots(updated);
      return updated;
    });
  };

  const handleCommentAdded = (c: PitchComment) => {
    setComments((prev) => [...prev, c]);
  };

  const copyLink = () => {
    if (typeof window === "undefined") return;
    const base = `${window.location.origin}/pitch/${projectId}`;
    const url = `${base}?view=1`;
    void navigator.clipboard.writeText(url).then(() => {
      toast.success("View-only link copied");
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400" />
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
            Loading pitch…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[15px] font-medium text-zinc-800 dark:text-zinc-200">
            {error}
          </p>
          <Link
            href="/"
            className="text-[13px] text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Go to floow.design
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Toaster position="bottom-center" />

      <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 no-underline"
            title="floow.design"
          >
            <span
              className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              floow
              <span className="text-zinc-500 dark:text-zinc-400">.design</span>
            </span>
          </Link>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
          <span className="max-w-[200px] truncate text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
            {projectName}
          </span>
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <Copy className="size-3.5" />
          Copy link
        </button>
      </div>

      <div className="shrink-0 px-6 pb-2 pt-8 sm:px-10 lg:px-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              <Tv
                className="size-4 shrink-0 text-zinc-600 dark:text-zinc-300"
                strokeWidth={2}
              />
              Pitch Concepts
            </p>
            <h1
              className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Top three concepts
            </h1>
          </div>
          <p className="max-w-[280px] text-[13px] leading-relaxed text-zinc-500 lg:pt-7 dark:text-zinc-400">
            {viewOnly
              ? "Review the design concepts below and leave your feedback."
              : "Choose three distinct theme directions and compare them side by side before committing."}
          </p>
        </div>

        {frames.length === 0 && (
          <p className="mt-6 text-[13px] text-amber-700 dark:text-amber-400/90">
            No screens in this project yet.
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-14">
        <div className="flex w-full flex-col gap-10 lg:flex-row lg:items-start lg:gap-8">
          {slots.map((slot, i) => (
            <ConceptColumn
              key={i}
              index={i}
              slot={slot}
              themes={themes}
              frames={frames}
              onUpdate={updateSlot}
              onToggleHidden={toggleHidden}
              viewOnly={viewOnly}
              projectId={projectId}
              comments={comments}
              onCommentAdded={handleCommentAdded}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PitchPage() {
  return (
    <Suspense>
      <PitchPageInner />
    </Suspense>
  );
}
