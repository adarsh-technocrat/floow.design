"use client";

import { useState, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setTheme } from "@/store/slices/canvasSlice";
import { X, Copy, Check, Plus, Sun, Moon, Trash2 } from "lucide-react";

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

function ColorSwatch({
  color,
  size = 24,
}: {
  color: string;
  size?: number;
}) {
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
  lightValue,
  darkValue,
  activeMode,
  onValueChange,
  onDelete,
  isCustom,
}: {
  varKey: string;
  name: string;
  lightValue: string;
  darkValue: string;
  activeMode: "light" | "dark";
  onValueChange: (key: string, value: string, mode: "light" | "dark") => void;
  onDelete?: (key: string) => void;
  isCustom?: boolean;
}) {
  const [editingMode, setEditingMode] = useState<"light" | "dark" | null>(null);
  const [draft, setDraft] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  const currentValue = activeMode === "light" ? lightValue : darkValue;
  const type = getVariableType(varKey, lightValue || darkValue);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(`var(${varKey})`);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1500);
  };

  const startEdit = (mode: "light" | "dark") => {
    setDraft(mode === "light" ? lightValue : darkValue);
    setEditingMode(mode);
  };

  const commitEdit = () => {
    if (editingMode && draft.trim()) {
      onValueChange(varKey, draft.trim(), editingMode);
    }
    setEditingMode(null);
  };

  return (
    <div className="group rounded-lg px-3 py-2 transition-colors hover:bg-input-bg/50">
      {/* Row 1: Name + actions */}
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

      {/* Row 2: Light / Dark variants side by side */}
      <div className="mt-1.5 flex items-stretch gap-2">
        {/* Light variant */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <Sun className="size-3 text-amber-500" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-t-tertiary">
              Light
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {type === "color" && lightValue ? (
              <div className="relative">
                <ColorSwatch color={lightValue} size={22} />
                <input
                  type="color"
                  value={lightValue.startsWith("#") ? lightValue : "#000000"}
                  onChange={(e) =>
                    onValueChange(varKey, e.target.value, "light")
                  }
                  className="absolute inset-0 size-[22px] cursor-pointer opacity-0"
                />
              </div>
            ) : null}
            {editingMode === "light" ? (
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditingMode(null);
                }}
                className="w-full rounded border border-b-secondary bg-input-bg px-1.5 py-0.5 text-[10px] font-mono text-t-primary outline-none focus:border-t-secondary"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => startEdit("light")}
                className="truncate text-[10px] font-mono text-t-secondary hover:text-t-primary transition-colors text-left"
              >
                {lightValue || "—"}
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-b-secondary self-stretch my-1" />

        {/* Dark variant */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <Moon className="size-3 text-indigo-400" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-t-tertiary">
              Dark
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {type === "color" && darkValue ? (
              <div className="relative">
                <ColorSwatch color={darkValue} size={22} />
                <input
                  type="color"
                  value={darkValue.startsWith("#") ? darkValue : "#000000"}
                  onChange={(e) =>
                    onValueChange(varKey, e.target.value, "dark")
                  }
                  className="absolute inset-0 size-[22px] cursor-pointer opacity-0"
                />
              </div>
            ) : null}
            {editingMode === "dark" ? (
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditingMode(null);
                }}
                className="w-full rounded border border-b-secondary bg-input-bg px-1.5 py-0.5 text-[10px] font-mono text-t-primary outline-none focus:border-t-secondary"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => startEdit("dark")}
                className="truncate text-[10px] font-mono text-t-secondary hover:text-t-primary transition-colors text-left"
              >
                {darkValue || "—"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddVariableForm({
  onAdd,
}: {
  onAdd: (key: string, light: string, dark: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [light, setLight] = useState("");
  const [dark, setDark] = useState("");

  const handleSubmit = () => {
    const k = key.trim().startsWith("--") ? key.trim() : `--${key.trim()}`;
    if (!k || k === "--") return;
    onAdd(k, light.trim() || "#000000", dark.trim() || "#ffffff");
    setKey("");
    setLight("");
    setDark("");
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
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-t-tertiary">
              <Sun className="size-2.5 text-amber-500" /> Light
            </label>
            <input
              type="text"
              value={light}
              onChange={(e) => setLight(e.target.value)}
              placeholder="#000000"
              className="w-full rounded border border-b-secondary bg-input-bg px-2 py-1.5 text-[11px] font-mono text-t-primary placeholder:text-t-tertiary outline-none focus:border-t-secondary"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-t-tertiary">
              <Moon className="size-2.5 text-indigo-400" /> Dark
            </label>
            <input
              type="text"
              value={dark}
              onChange={(e) => setDark(e.target.value)}
              placeholder="#ffffff"
              className="w-full rounded border border-b-secondary bg-input-bg px-2 py-1.5 text-[11px] font-mono text-t-primary placeholder:text-t-tertiary outline-none focus:border-t-secondary"
            />
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setKey("");
            setLight("");
            setDark("");
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
  const theme = useAppSelector((s) => s.canvas.theme);
  const dispatch = useAppDispatch();
  const [activeMode, setActiveMode] = useState<"light" | "dark">("light");

  // Dark variants are stored as --key-dark in the theme object
  const getLightValue = useCallback(
    (key: string) => theme[key] ?? "",
    [theme],
  );
  const getDarkValue = useCallback(
    (key: string) => theme[`${key}-dark`] ?? theme[key] ?? "",
    [theme],
  );

  const handleValueChange = useCallback(
    (key: string, value: string, mode: "light" | "dark") => {
      if (mode === "light") {
        dispatch(setTheme({ [key]: value }));
      } else {
        // Store dark variant separately; apply if currently previewing dark
        dispatch(setTheme({ [`${key}-dark`]: value }));
      }
    },
    [dispatch],
  );

  const handleAddVariable = useCallback(
    (key: string, light: string, dark: string) => {
      dispatch(setTheme({ [key]: light, [`${key}-dark`]: dark }));
    },
    [dispatch],
  );

  const handleDeleteVariable = useCallback(
    (key: string) => {
      // Set to empty to effectively remove — setTheme skips undefined but we can set empty
      dispatch(setTheme({ [key]: "", [`${key}-dark`]: "" }));
    },
    [dispatch],
  );

  if (!open) return null;

  const hasTheme = Object.keys(theme).filter((k) => k.startsWith("--") && !k.endsWith("-dark") && theme[k]).length > 0;

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

      {/* Mode toggle */}
      {hasTheme && (
        <div className="flex items-center gap-1 border-b border-b-secondary px-4 py-2 shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-t-tertiary mr-auto">
            Preview mode
          </span>
          <div className="inline-flex rounded-md border border-b-secondary bg-input-bg p-0.5">
            <button
              type="button"
              onClick={() => setActiveMode("light")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-mono font-medium transition-colors ${
                activeMode === "light"
                  ? "bg-surface-elevated text-t-primary shadow-sm"
                  : "text-t-tertiary hover:text-t-secondary"
              }`}
            >
              <Sun className="size-3" />
              Light
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("dark")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-mono font-medium transition-colors ${
                activeMode === "dark"
                  ? "bg-surface-elevated text-t-primary shadow-sm"
                  : "text-t-tertiary hover:text-t-secondary"
              }`}
            >
              <Moon className="size-3" />
              Dark
            </button>
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
            <p className="text-xs font-medium text-t-secondary">
              No theme yet
            </p>
            <p className="mt-1 text-[11px] text-t-tertiary">
              Generate a design to create theme variables.
            </p>
          </div>
        ) : (
          <div className="py-2">
            {VARIABLE_GROUPS.map((group) => {
              const groupVars = group.vars.filter(
                (v) => theme[v.key] !== undefined && theme[v.key] !== "",
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
                      lightValue={getLightValue(v.key)}
                      darkValue={getDarkValue(v.key)}
                      activeMode={activeMode}
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
              const extras = Object.entries(theme).filter(
                ([k, v]) =>
                  !knownKeys.has(k) &&
                  k.startsWith("--") &&
                  !k.endsWith("-dark") &&
                  v !== "",
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
                      lightValue={getLightValue(k)}
                      darkValue={getDarkValue(k)}
                      activeMode={activeMode}
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
            Edits apply live to all screens. Click swatches to pick colors.
          </p>
        </div>
      )}
    </div>
  );
}
