"use client";

import { useState, useCallback, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  setActiveThemeId,
  setActiveThemeMode,
  setThemeVariantVariable,
  assignThemeToFrame,
  addThemeVariant,
  removeThemeVariant,
  type ThemeMode,
} from "@/store/slices/canvasSlice";
import {
  X,
  Copy,
  Check,
  Plus,
  Sun,
  Moon,
  Trash2,
  ChevronDown,
  Layers,
} from "lucide-react";
import { resolveVariant } from "@/lib/screen-utils";
import http from "@/lib/http";

const VARIABLE_GROUPS: {
  label: string;
  vars: { key: string; name: string }[];
}[] = [
  {
    label: "Brand",
    vars: [
      { key: "--primary", name: "Primary" },
      { key: "--primary-foreground", name: "Primary Foreground" },
      { key: "--secondary", name: "Secondary" },
      { key: "--secondary-foreground", name: "Secondary Foreground" },
    ],
  },
  {
    label: "Surface",
    vars: [
      { key: "--background", name: "Background" },
      { key: "--foreground", name: "Foreground" },
      { key: "--card", name: "Card" },
      { key: "--card-foreground", name: "Card Foreground" },
      { key: "--muted", name: "Muted" },
      { key: "--muted-foreground", name: "Muted Foreground" },
    ],
  },
  {
    label: "Misc",
    vars: [
      { key: "--border", name: "Border" },
      { key: "--input", name: "Input" },
      { key: "--ring", name: "Ring" },
      { key: "--radius", name: "Radius" },
      { key: "--font-sans", name: "Font Sans" },
      { key: "--font-heading", name: "Font Heading" },
    ],
  },
];

function isColor(value: string): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v.startsWith("#") || v.startsWith("rgb") || v.startsWith("hsl");
}

function getVariableType(
  key: string,
  value: string,
): "color" | "size" | "font" | "string" {
  if (key.includes("font")) return "font";
  if (key.includes("radius")) return "size";
  if (isColor(value)) return "color";
  return "string";
}

function ColorSwatch({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <div
      className="shrink-0 rounded-md border border-b-secondary shadow-inner"
      style={{ backgroundColor: color, width: size, height: size }}
    />
  );
}

function VariableRow({
  varKey,
  name,
  value,
  onValueChange,
  onDelete,
  isCustom,
}: {
  varKey: string;
  name: string;
  value: string;
  onValueChange: (key: string, value: string) => void;
  onDelete?: (key: string) => void;
  isCustom?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  const type = getVariableType(varKey, value);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(`var(${varKey})`);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1500);
  };

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  const commitEdit = () => {
    if (draft.trim()) {
      onValueChange(varKey, draft.trim());
    }
    setEditing(false);
  };

  return (
    <div className="group rounded-lg px-3 py-2 transition-colors hover:bg-input-bg/50">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-t-primary truncate flex-1">
          {name}
        </span>
        <button
          type="button"
          onClick={handleCopyKey}
          className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-t-tertiary hover:text-t-primary"
          title={`Copy var(${varKey})`}
        >
          {copiedKey ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
        {isCustom && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(varKey)}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-t-tertiary hover:text-red-400"
            title="Remove variable"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        {type === "color" && value ? (
          <div className="relative">
            <ColorSwatch color={value} size={22} />
            <input
              type="color"
              value={value.startsWith("#") ? value : "#000000"}
              onChange={(e) => onValueChange(varKey, e.target.value)}
              className="absolute inset-0 size-[22px] cursor-pointer opacity-0"
            />
          </div>
        ) : null}
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-full rounded border border-b-secondary bg-input-bg px-1.5 py-0.5 text-[10px] font-mono text-t-primary outline-none focus:border-t-secondary"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="truncate text-[10px] font-mono text-t-secondary hover:text-t-primary transition-colors text-left"
          >
            {value || "—"}
          </button>
        )}
      </div>
    </div>
  );
}

function AddVariableForm({
  onAdd,
}: {
  onAdd: (key: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const k = key.trim().startsWith("--") ? key.trim() : `--${key.trim()}`;
    if (!k || k === "--") return;
    onAdd(k, value.trim() || "#000000");
    setKey("");
    setValue("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-3 mb-3 flex w-[calc(100%-24px)] items-center justify-center gap-1.5 rounded-lg border border-dashed border-b-secondary px-3 py-2 text-[11px] font-medium text-t-secondary hover:border-t-tertiary hover:bg-input-bg hover:text-t-primary transition-colors"
      >
        <Plus className="size-3.5" />
        Add variable
      </button>
    );
  }

  return (
    <div className="mx-3 mb-3 rounded-lg border border-b-secondary bg-surface-sunken p-3">
      <div className="space-y-2">
        <div>
          <label className="mb-1 block text-[9px] font-mono uppercase tracking-widest text-t-tertiary">
            Variable name
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="--accent"
            className="w-full rounded border border-b-secondary bg-input-bg px-2 py-1.5 text-[11px] font-mono text-t-primary placeholder:text-t-tertiary outline-none focus:border-t-secondary"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-[9px] font-mono uppercase tracking-widest text-t-tertiary">
            Value
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="#000000"
            className="w-full rounded border border-b-secondary bg-input-bg px-2 py-1.5 text-[11px] font-mono text-t-primary placeholder:text-t-tertiary outline-none focus:border-t-secondary"
          />
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setKey("");
            setValue("");
          }}
          className="rounded px-2.5 py-1 text-[11px] text-t-secondary hover:bg-input-bg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded bg-t-primary px-2.5 py-1 text-[11px] font-medium text-surface transition-opacity hover:opacity-90"
        >
          Add
        </button>
      </div>
    </div>
  );
}

interface StyleGuidePanelProps {
  open: boolean;
  onClose: () => void;
}

export function StyleGuidePanel({ open, onClose }: StyleGuidePanelProps) {
  const themes = useAppSelector((s) => s.canvas.themes);
  const activeThemeId = useAppSelector((s) => s.canvas.activeThemeId);
  const activeMode = useAppSelector((s) => s.canvas.activeThemeMode);
  const selectedFrameIds = useAppSelector((s) => s.canvas.selectedFrameIds);
  const frames = useAppSelector((s) => s.canvas.frames);
  const dispatch = useAppDispatch();

  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariantName, setNewVariantName] = useState("");
  const pendingThemeUpdatesRef = useRef(
    new Map<
      string,
      { themeId: string; variantName: string; key: string; value: string }
    >(),
  );
  const rafFlushRef = useRef<number | null>(null);
  const pendingPersistRef = useRef(
    new Map<
      string,
      {
        themeId: string;
        variantName: string;
        variables: Record<string, string>;
      }
    >(),
  );
  const persistInFlightRef = useRef(false);

  const activeTheme = themes.find((t) => t.id === activeThemeId);
  const variantNames = activeTheme ? Object.keys(activeTheme.variants) : [];
  const currentVariant = activeTheme
    ? resolveVariant(activeTheme.variants, activeMode)
    : {};

  const selectedFrame =
    selectedFrameIds.length === 1
      ? frames.find((f) => f.id === selectedFrameIds[0])
      : undefined;

  const flushThemePersistence = useCallback(() => {
    if (persistInFlightRef.current) return;
    const first = pendingPersistRef.current.entries().next();
    if (first.done) return;
    const [persistKey, payload] = first.value;
    pendingPersistRef.current.delete(persistKey);
    persistInFlightRef.current = true;

    http
      .put("/api/themes", {
        id: payload.themeId,
        variantName: payload.variantName,
        variables: payload.variables,
      })
      .catch(() => {})
      .finally(() => {
        persistInFlightRef.current = false;
        if (pendingPersistRef.current.size > 0) {
          flushThemePersistence();
        }
      });
  }, []);

  const queueVariantPersistence = useCallback(
    (
      themeId: string,
      variantName: string,
      variables: Record<string, string>,
    ) => {
      const persistKey = `${themeId}:${variantName}`;
      pendingPersistRef.current.set(persistKey, {
        themeId,
        variantName,
        variables,
      });
      flushThemePersistence();
    },
    [flushThemePersistence],
  );

  const flushThemeUpdates = useCallback(() => {
    rafFlushRef.current = null;
    const updates = Array.from(pendingThemeUpdatesRef.current.values());
    pendingThemeUpdatesRef.current.clear();
    if (updates.length === 0) return;

    for (const u of updates) {
      dispatch(
        setThemeVariantVariable({
          themeId: u.themeId,
          variantName: u.variantName,
          key: u.key,
          value: u.value,
        }),
      );
    }
  }, [dispatch, frames.length]);

  const handleValueChange = useCallback(
    (key: string, value: string) => {
      if (!activeThemeId) return;
      const fullVariantSnapshot = {
        ...(activeTheme
          ? resolveVariant(activeTheme.variants, activeMode)
          : {}),
        [key]: value,
      };
      queueVariantPersistence(activeThemeId, activeMode, fullVariantSnapshot);
      pendingThemeUpdatesRef.current.set(
        `${activeThemeId}:${activeMode}:${key}`,
        {
          themeId: activeThemeId,
          variantName: activeMode,
          key,
          value,
        },
      );
      if (rafFlushRef.current == null) {
        rafFlushRef.current = requestAnimationFrame(flushThemeUpdates);
      }
    },
    [
      activeThemeId,
      activeTheme,
      activeMode,
      frames.length,
      flushThemeUpdates,
      queueVariantPersistence,
    ],
  );

  const handleDeleteVariable = useCallback(
    (key: string) => {
      handleValueChange(key, "");
    },
    [handleValueChange],
  );

  const handleAddVariable = useCallback(
    (key: string, value: string) => {
      handleValueChange(key, value);
    },
    [handleValueChange],
  );

  const handleAddVariant = () => {
    const name = newVariantName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name || !activeThemeId) return;
    if (activeTheme?.variants[name]) {
      setShowAddVariant(false);
      setNewVariantName("");
      return;
    }
    const fullVariantSnapshot = activeTheme
      ? resolveVariant(activeTheme.variants, activeMode)
      : {};
    dispatch(
      addThemeVariant({
        themeId: activeThemeId,
        variantName: name,
        baseVariant: activeMode,
      }),
    );
    queueVariantPersistence(activeThemeId, name, fullVariantSnapshot);
    dispatch(setActiveThemeMode(name as ThemeMode));
    setNewVariantName("");
    setShowAddVariant(false);
  };

  const handleRemoveVariant = (variantName: string) => {
    if (!activeThemeId || variantName === "light") return;
    dispatch(removeThemeVariant({ themeId: activeThemeId, variantName }));
  };

  const handleAssignToFrame = (themeId: string, variantName: string) => {
    if (!selectedFrame) return;
    dispatch(
      assignThemeToFrame({
        frameId: selectedFrame.id,
        themeId,
        variantName,
      }),
    );
  };

  if (!open) return null;

  const hasTheme = activeTheme && variantNames.length > 0;

  return (
    <div className="absolute right-14 top-0 z-20 w-[340px] max-h-[calc(100vh-100px)] overflow-hidden rounded-xl border border-b-strong bg-surface-elevated shadow-xl backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-b-secondary px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-t-secondary"
          >
            <circle cx="13.5" cy="6.5" r="2.5" />
            <circle cx="19" cy="17" r="2.5" />
            <circle cx="6" cy="12" r="2.5" />
            <path d="M16 6.5h4M8 12h3M16.5 17H22" />
          </svg>
          <span className="text-sm font-semibold text-t-primary">
            Style Guide
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-t-tertiary hover:bg-input-bg hover:text-t-primary transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Theme selector dropdown */}
      {themes.length > 0 && (
        <div className="border-b border-b-secondary px-4 py-2.5 shrink-0">
          <label className="text-[9px] font-mono uppercase tracking-widest text-t-tertiary mb-1.5 block">
            Theme
          </label>
          <div className="relative">
            <select
              value={activeThemeId ?? ""}
              onChange={(e) => dispatch(setActiveThemeId(e.target.value))}
              className="w-full appearance-none rounded-lg border border-b-secondary bg-input-bg px-3 py-2 pr-8 text-xs font-medium text-t-primary outline-none focus:border-t-secondary cursor-pointer"
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-t-tertiary" />
          </div>
        </div>
      )}

      {/* Variant tabs */}
      {hasTheme && (
        <div className="border-b border-b-secondary px-4 py-2.5 shrink-0">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Layers className="size-3 text-t-tertiary" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-t-tertiary">
              Variant
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide rounded-md border border-b-secondary bg-input-bg p-0.5">
              <div className="inline-flex min-w-max items-center gap-1">
                {variantNames.map((vName) => (
                  <button
                    key={vName}
                    type="button"
                    onClick={() =>
                      dispatch(setActiveThemeMode(vName as ThemeMode))
                    }
                    className={`group/tab flex items-center gap-1 whitespace-nowrap rounded px-2 py-1 text-[10px] font-mono font-medium transition-colors ${
                      activeMode === vName
                        ? "bg-surface-elevated text-t-primary shadow-sm"
                        : "text-t-tertiary hover:text-t-secondary"
                    }`}
                  >
                    {vName === "light" ? (
                      <Sun className="size-3" />
                    ) : vName === "dark" ? (
                      <Moon className="size-3" />
                    ) : (
                      <Layers className="size-3" />
                    )}
                    {vName}
                    {vName !== "light" && activeMode === vName && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveVariant(vName);
                        }}
                        className="ml-0.5 rounded p-0.5 opacity-0 group-hover/tab:opacity-100 text-t-tertiary hover:text-red-400 transition-all"
                        title={`Remove ${vName} variant`}
                      >
                        <X className="size-2.5" />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddVariant(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-b-secondary bg-input-bg px-2 py-1 text-[10px] font-mono text-t-secondary hover:text-t-primary transition-colors"
              title="Add variant"
            >
              <Plus className="size-3" />
              Add
            </button>
          </div>
        </div>
      )}

      {/* Add variant form */}
      {showAddVariant && (
        <div className="border-b border-b-secondary px-4 py-2.5 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={newVariantName}
            onChange={(e) => setNewVariantName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddVariant();
              if (e.key === "Escape") setShowAddVariant(false);
            }}
            placeholder="e.g. high-contrast"
            className="flex-1 rounded border border-b-secondary bg-input-bg px-2 py-1 text-[11px] font-mono text-t-primary placeholder:text-t-tertiary outline-none focus:border-t-secondary"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddVariant}
            className="rounded bg-t-primary px-2 py-1 text-[10px] font-medium text-surface"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddVariant(false);
              setNewVariantName("");
            }}
            className="rounded p-1 text-t-tertiary hover:text-t-primary"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Per-frame assignment */}
      {selectedFrame && hasTheme && (
        <div className="border-b border-b-secondary px-4 py-2.5 shrink-0 bg-input-bg/30">
          <div className="flex items-center gap-1.5 mb-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-t-secondary"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            <span className="text-[10px] font-mono font-medium text-t-secondary truncate">
              {selectedFrame.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedFrame.themeId ?? activeThemeId ?? ""}
              onChange={(e) =>
                handleAssignToFrame(
                  e.target.value,
                  selectedFrame.variantName ?? activeMode,
                )
              }
              className="flex-1 appearance-none rounded border border-b-secondary bg-input-bg px-2 py-1.5 text-[11px] font-mono text-t-primary outline-none cursor-pointer"
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={selectedFrame.variantName ?? activeMode}
              onChange={(e) =>
                handleAssignToFrame(
                  selectedFrame.themeId ?? activeThemeId ?? "",
                  e.target.value,
                )
              }
              className="w-24 appearance-none rounded border border-b-secondary bg-input-bg px-2 py-1.5 text-[11px] font-mono text-t-primary outline-none cursor-pointer"
            >
              {variantNames.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!hasTheme ? (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-dashed border-b-secondary bg-surface-sunken">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-t-tertiary"
              >
                <circle cx="13.5" cy="6.5" r="2.5" />
                <circle cx="19" cy="17" r="2.5" />
                <circle cx="6" cy="12" r="2.5" />
              </svg>
            </div>
            <p className="text-xs font-medium text-t-secondary">No theme yet</p>
            <p className="mt-1 text-[11px] text-t-tertiary">
              Generate a design to create theme variables.
            </p>
          </div>
        ) : (
          <div className="py-2">
            {VARIABLE_GROUPS.map((group) => {
              const groupVars = group.vars.filter(
                (v) =>
                  currentVariant[v.key] !== undefined &&
                  currentVariant[v.key] !== "",
              );
              if (groupVars.length === 0) return null;
              return (
                <div key={group.label} className="mb-1">
                  <p className="px-4 py-2 text-[10px] font-mono font-medium uppercase tracking-widest text-t-tertiary">
                    {group.label}
                  </p>
                  {groupVars.map((v) => (
                    <VariableRow
                      key={v.key}
                      varKey={v.key}
                      name={v.name}
                      value={currentVariant[v.key] ?? ""}
                      onValueChange={handleValueChange}
                    />
                  ))}
                </div>
              );
            })}

            {/* Custom variables */}
            {(() => {
              const knownKeys = new Set(
                VARIABLE_GROUPS.flatMap((g) => g.vars.map((v) => v.key)),
              );
              const extras = Object.entries(currentVariant).filter(
                ([k, v]) => !knownKeys.has(k) && k.startsWith("--") && v !== "",
              );
              if (extras.length === 0) return null;
              return (
                <div className="mb-1">
                  <p className="px-4 py-2 text-[10px] font-mono font-medium uppercase tracking-widest text-t-tertiary">
                    Custom
                  </p>
                  {extras.map(([k]) => (
                    <VariableRow
                      key={k}
                      varKey={k}
                      name={k.replace(/^--/, "")}
                      value={currentVariant[k] ?? ""}
                      onValueChange={handleValueChange}
                      onDelete={handleDeleteVariable}
                      isCustom
                    />
                  ))}
                </div>
              );
            })()}

            <AddVariableForm onAdd={handleAddVariable} />
          </div>
        )}
      </div>

      {/* Footer */}
      {hasTheme && (
        <div className="border-t border-b-secondary px-4 py-2.5 shrink-0">
          <p className="text-[10px] text-t-tertiary/60">
            Editing{" "}
            <span className="font-medium text-t-tertiary">
              {activeTheme?.name}
            </span>{" "}
            / <span className="font-medium text-t-tertiary">{activeMode}</span>.
            Changes apply live.
          </p>
        </div>
      )}
    </div>
  );
}
