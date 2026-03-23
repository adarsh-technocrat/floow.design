"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setTheme } from "@/store/slices/canvasSlice";
import { X, Copy, Check } from "lucide-react";

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
      { key: "--radius", name: "Radius" },
      { key: "--font-sans", name: "Font Sans" },
      { key: "--font-heading", name: "Font Heading" },
    ],
  },
];

function isColor(value: string): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  if (v.startsWith("#")) return true;
  if (v.startsWith("rgb") || v.startsWith("hsl")) return true;
  return false;
}

function getVariableType(key: string, value: string): "color" | "size" | "font" | "string" {
  if (key.includes("font")) return "font";
  if (key.includes("radius")) return "size";
  if (isColor(value)) return "color";
  return "string";
}

function ColorSwatch({ color }: { color: string }) {
  return (
    <div
      className="size-7 shrink-0 rounded-md border border-b-secondary shadow-inner"
      style={{ backgroundColor: color }}
    />
  );
}

function VariableRow({
  varKey,
  name,
  value,
  onValueChange,
}: {
  varKey: string;
  name: string;
  value: string;
  onValueChange: (key: string, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [copiedKey, setCopiedKey] = useState(false);
  const type = getVariableType(varKey, value);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(`var(${varKey})`);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1500);
  };

  const commitEdit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) {
      onValueChange(varKey, draft.trim());
    } else {
      setDraft(value);
    }
  };

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-input-bg/50">
      {/* Swatch / Type indicator */}
      {type === "color" ? (
        <div className="relative">
          <ColorSwatch color={value} />
          <input
            type="color"
            value={value.startsWith("#") ? value : "#000000"}
            onChange={(e) => onValueChange(varKey, e.target.value)}
            className="absolute inset-0 size-7 cursor-pointer opacity-0"
            title="Pick color"
          />
        </div>
      ) : type === "font" ? (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-b-secondary bg-surface-sunken text-[10px] font-bold text-t-tertiary">
          Aa
        </div>
      ) : type === "size" ? (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-b-secondary bg-surface-sunken">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-t-tertiary">
            <path d="M21 3H3v18h18V3z" rx="3" />
          </svg>
        </div>
      ) : (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-b-secondary bg-surface-sunken text-[10px] text-t-tertiary">
          #
        </div>
      )}

      {/* Name + Value */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-t-primary truncate">
            {name}
          </span>
          <button
            type="button"
            onClick={handleCopyKey}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-t-tertiary hover:text-t-primary"
            title={`Copy var(${varKey})`}
          >
            {copiedKey ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
          </button>
        </div>
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
            className="mt-0.5 w-full rounded border border-b-secondary bg-input-bg px-1.5 py-0.5 text-[11px] font-mono text-t-secondary outline-none focus:border-t-secondary"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(value); setEditing(true); }}
            className="mt-0.5 block truncate text-[11px] font-mono text-t-tertiary hover:text-t-secondary transition-colors text-left"
          >
            {value || "—"}
          </button>
        )}
      </div>

      {/* Secondary swatch for foreground pairs */}
      {type === "color" && value && (
        <code className="hidden sm:block shrink-0 text-[10px] font-mono text-t-tertiary/60 uppercase">
          {value}
        </code>
      )}
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

  if (!open) return null;

  const hasTheme = Object.keys(theme).length > 0;

  const handleValueChange = (key: string, value: string) => {
    dispatch(setTheme({ [key]: value }));
  };

  return (
    <div className="absolute right-14 top-16 z-20 w-[300px] overflow-hidden rounded-xl border border-b-secondary bg-surface-elevated shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-b-secondary px-4 py-3">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-t-secondary">
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

      {/* Content */}
      <div className="max-h-[520px] overflow-y-auto">
        {!hasTheme ? (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-dashed border-b-secondary bg-surface-sunken">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-t-tertiary">
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
              const groupVars = group.vars.filter((v) => theme[v.key] !== undefined);
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
                      value={theme[v.key] ?? ""}
                      onValueChange={handleValueChange}
                    />
                  ))}
                </div>
              );
            })}

            {/* Any extra variables not in the groups */}
            {(() => {
              const knownKeys = new Set(VARIABLE_GROUPS.flatMap((g) => g.vars.map((v) => v.key)));
              const extras = Object.entries(theme).filter(([k]) => !knownKeys.has(k));
              if (extras.length === 0) return null;
              return (
                <div className="mb-1">
                  <p className="px-4 py-2 text-[10px] font-mono font-medium uppercase tracking-widest text-t-tertiary">
                    Custom
                  </p>
                  {extras.map(([k, v]) => (
                    <VariableRow
                      key={k}
                      varKey={k}
                      name={k.replace(/^--/, "")}
                      value={v}
                      onValueChange={handleValueChange}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Footer */}
      {hasTheme && (
        <div className="border-t border-b-secondary px-4 py-2.5">
          <p className="text-[10px] text-t-tertiary/60">
            Click a value to edit. Color swatches open a picker.
          </p>
        </div>
      )}
    </div>
  );
}
