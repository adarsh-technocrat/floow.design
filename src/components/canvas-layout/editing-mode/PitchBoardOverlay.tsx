"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Tv,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  PITCH_CONCEPT_SLOT_COUNT,
  togglePitchSlotHidden,
  updatePitchSlot,
  type PitchSlotState,
  type StoredTheme,
} from "@/store/slices/canvasSlice";
import {
  extractBodyContent,
  injectFrameScripts,
  looksLikeMalformedFrameContent,
  resolveVariant,
  truncatePartialHtml,
  wrapScreenBody,
} from "@/lib/screen-utils";

const DEVICE_W = 390;
const DEVICE_H = 844;
const PREVIEW_SCALE = 0.5;
const PREVIEW_HEIGHT = Math.ceil(DEVICE_H * PREVIEW_SCALE) + 56;

function usePitchSlotPreviewHtml(
  frameHtml: string | undefined,
  theme: StoredTheme | undefined,
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

function ScreenPreview({
  html,
  label,
  rotation,
  translateY,
  zIndex,
}: {
  html: string;
  label: string;
  rotation: number;
  translateY: number;
  zIndex: number;
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
        className="overflow-hidden rounded-xl border border-border/30 bg-white shadow-md"
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
              colorScheme: "light",
            }}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-surface-sunken text-[10px] font-mono text-t-tertiary">
            No preview
          </div>
        )}
      </div>
    </div>
  );
}

function getScreenTransform(count: number, i: number) {
  const rotation =
    count >= 3 ? ([-4, 0, 4][i] ?? 0) : count === 2 ? ([-3, 3][i] ?? 0) : 0;
  const translateY = count >= 3 ? (i === 1 ? -10 : 6) : 0;
  const zIndex = count >= 3 && i === 1 ? 2 : 1;
  return { rotation, translateY, zIndex };
}

function PitchConceptColumn({
  index,
  slot,
  themes,
  previewFrames,
  hasThemes,
  disabledConceptLabel,
}: {
  index: number;
  slot: PitchSlotState;
  themes: StoredTheme[];
  previewFrames: { id: string; label: string; html: string }[];
  hasThemes: boolean;
  disabledConceptLabel: string;
}) {
  const dispatch = useAppDispatch();
  const conceptLabel = `Concept ${index + 1}`;

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

  const html0 = usePitchSlotPreviewHtml(previewFrames[0]?.html, theme, variant);
  const html1 = usePitchSlotPreviewHtml(previewFrames[1]?.html, theme, variant);
  const html2 = usePitchSlotPreviewHtml(previewFrames[2]?.html, theme, variant);
  const previewHtmlList = [html0, html1, html2].slice(0, previewFrames.length);

  const setThemeId = (themeId: string) =>
    dispatch(updatePitchSlot({ index, changes: { themeId: themeId || null } }));

  const setVariantName = (v: string) =>
    dispatch(updatePitchSlot({ index, changes: { variantName: v } }));

  const setDescription = (d: string) =>
    dispatch(updatePitchSlot({ index, changes: { description: d } }));

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div
        className={`group flex flex-col overflow-hidden rounded-2xl border border-b-secondary bg-surface-elevated shadow-sm transition-all hover:border-b-strong hover:shadow-lg ${
          slot.hidden ? "opacity-50" : ""
        }`}
      >
        <div
          className="relative flex w-full items-end justify-center overflow-hidden border-b border-b-secondary/80 bg-surface-sunken px-4 pt-6"
          style={{
            height: PREVIEW_HEIGHT,
            backgroundImage:
              "radial-gradient(var(--canvas-dot) 0.65px, transparent 0.65px)",
            backgroundSize: "14px 14px",
            gap: previewFrames.length >= 3 ? "10px" : "12px",
          }}
        >
          {slot.hidden ? (
            <div className="mb-4 flex items-center justify-center rounded-lg border border-dashed border-b-secondary px-4 py-8 text-[12px] font-mono text-t-tertiary">
              Hidden
            </div>
          ) : previewFrames.length === 0 ? (
            <div className="mb-4 text-[11px] font-mono text-t-tertiary">
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
                  key={previewFrames[i]?.id ?? i}
                  html={html}
                  label={previewFrames[i]?.label ?? `Screen ${i + 1}`}
                  rotation={rotation}
                  translateY={translateY}
                  zIndex={zIndex}
                />
              );
            })
          )}
        </div>
      </div>

      <p className="text-[12px] font-medium text-zinc-500 sm:hidden dark:text-zinc-400">
        {conceptLabel}
      </p>

      <div className="flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex min-w-0 flex-1 flex-col sm:flex-row">
          <div className="relative min-w-0 flex-1 border-b border-zinc-100 sm:border-b-0 sm:border-r dark:border-zinc-800">
            <span className="pointer-events-none absolute left-3 top-1/2 z-1 hidden -translate-y-1/2 text-[11px] font-medium text-zinc-400 sm:block">
              {conceptLabel}
            </span>
            <select
              disabled={!hasThemes}
              value={slot.themeId ?? ""}
              onChange={(e) => setThemeId(e.target.value)}
              className="h-11 w-full cursor-pointer appearance-none bg-transparent py-2 pl-3 pr-9 text-[13px] font-medium text-zinc-800 outline-none disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-100 sm:pl-22"
              aria-label={`${conceptLabel} theme`}
            >
              <option value="">{disabledConceptLabel}</option>
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
              disabled={!hasThemes || !theme}
              value={
                variantNames.includes(slot.variantName)
                  ? slot.variantName
                  : (variantNames[0] ?? "light")
              }
              onChange={(e) => setVariantName(e.target.value)}
              className="h-11 w-full cursor-pointer appearance-none bg-transparent py-2 pl-3 pr-9 text-[12px] font-medium text-zinc-600 outline-none disabled:cursor-not-allowed disabled:opacity-45 dark:text-zinc-300"
              aria-label={`${conceptLabel} variant`}
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
          onClick={() => dispatch(togglePitchSlotHidden(index))}
          className="flex w-11 shrink-0 items-center justify-center border-l border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          title={slot.hidden ? "Show concept" : "Hide concept"}
          aria-pressed={slot.hidden}
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
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a description…"
        rows={3}
        className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-800 placeholder:text-zinc-400 outline-none transition-shadow focus:border-zinc-300 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
      />
    </div>
  );
}

export function PitchBoardOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const params = useParams();
  const projectId = (params?.id ?? params?.projectId) as string | undefined;
  const frames = useAppSelector((s) => s.canvas.frames);
  const themes = useAppSelector((s) => s.canvas.themes);
  const pitchSlots = useAppSelector((s) => s.canvas.pitchSlots);
  const projectName = useAppSelector((s) => s.project.projectName);

  const hasThemes = themes.length > 0;
  const disabledConceptLabel = hasThemes ? "Select theme…" : "No more concepts";

  const pitchUrl =
    typeof window !== "undefined" && projectId
      ? `${window.location.origin}/pitch/${projectId}`
      : "";

  const viewOnlyUrl = pitchUrl ? `${pitchUrl}?view=1` : "";

  const copyPitchLink = () => {
    if (!viewOnlyUrl) return;
    void navigator.clipboard.writeText(viewOnlyUrl).then(() => {
      toast.success("View-only link copied");
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col bg-[#f7f7f7] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pitch-board-title"
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 no-underline"
            title="Back to dashboard"
          >
            <span
              className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              floow
              <span className="text-zinc-500 dark:text-zinc-400">.design</span>
            </span>
          </Link>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
          <span className="max-w-[200px] truncate text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
            {projectName ?? "Untitled Project"}
          </span>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2} />
            Canvas
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyPitchLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Copy className="size-3.5" />
            Copy link
          </button>
          {pitchUrl && (
            <Link
              href={pitchUrl}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 no-underline dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <ExternalLink className="size-3.5" />
              Open
            </Link>
          )}
        </div>
      </div>

      <div className="shrink-0 px-6 pb-2 pt-8 sm:px-10 lg:px-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              <Tv
                className="size-4 shrink-0 text-zinc-600 dark:text-zinc-300"
                strokeWidth={2}
                aria-hidden
              />
              Pitch Concepts
            </p>
            <h1
              id="pitch-board-title"
              className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-white"
            >
              Top three concepts
            </h1>
          </div>
          <p className="max-w-[280px] text-[13px] leading-relaxed text-zinc-500 lg:pt-7 dark:text-zinc-400">
            Choose three distinct theme directions and compare them side by side
            before committing.
          </p>
        </div>

        {frames.length === 0 && (
          <p className="mt-6 text-[13px] text-amber-700 dark:text-amber-400/90">
            Add at least one screen to the canvas to preview concepts.
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-14">
        <div className="flex w-full flex-col gap-10 lg:flex-row lg:items-start lg:gap-8">
          {Array.from({ length: PITCH_CONCEPT_SLOT_COUNT }, (_, i) => {
            const slot = pitchSlots[i];
            if (!slot) return null;
            return (
              <PitchConceptColumn
                key={i}
                index={i}
                slot={slot}
                themes={themes}
                previewFrames={frames.slice(0, 3)}
                hasThemes={hasThemes}
                disabledConceptLabel={disabledConceptLabel}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
