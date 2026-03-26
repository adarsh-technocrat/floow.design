"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProjects,
  createProject as createProjectThunk,
  trashProject as trashProjectThunk,
  fetchTrashedProjects,
  restoreProject as restoreProjectThunk,
  permanentlyDeleteProject,
} from "@/store/slices/projectsSlice";
import { fetchUserPlan } from "@/store/slices/userSlice";
import { ThemeToggleCompact } from "@/components/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { PricingDialog } from "@/components/PricingDialog";
import { ProjectFramePreview } from "@/components/ProjectFramePreview";
import http from "@/lib/http";
import { useImageAttachments } from "@/hooks/useImageAttachments";

interface _Project {
  id: string;
  name: string;
  screens: number;
  createdAt: string;
  updatedAt: string;
}

interface _TrashedProject {
  id: string;
  name: string;
  screens: number;
  trashedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface UserPlanSummary {
  plan: string;
  billingInterval: string | null;
  credits: number;
  creditCap: number;
  creditsResetAt: string | null;
}

const planDisplayLabels: Record<string, string> = {
  FREE: "Free",
  LITE: "Lite",
  STARTER: "Starter",
  PRO: "Pro",
  TEAM: "Team",
};

function formatCreditsSoftLabel(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) {
    const k = n / 1000;
    const s =
      k >= 10 ? Math.round(k).toString() : k.toFixed(1).replace(/\.0$/, "");
    return `${s}k`;
  }
  return n.toLocaleString();
}

function shortResetHint(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  if (diff < 0) return "Allowance refreshes soon";
  const days = Math.ceil(diff / 86_400_000);
  if (days <= 1) return "Refreshes tomorrow";
  if (days < 7) return `Refreshes in ${days} days`;
  return `Refreshes ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function DashboardSidebarUsage({
  summary,
  loading,
  onManage,
}: {
  summary: UserPlanSummary | null;
  loading: boolean;
  onManage: () => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-b-secondary bg-surface-sunken px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 animate-pulse rounded bg-t-tertiary/15" />
          <div className="ml-auto h-3 w-8 animate-pulse rounded bg-t-tertiary/10" />
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-t-tertiary/8">
          <div className="h-full w-2/5 animate-pulse rounded-full bg-t-tertiary/12" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  if (summary.plan === "FREE" || summary.creditCap <= 0) return null;

  const { credits, creditCap, plan, billingInterval, creditsResetAt } = summary;
  const safeRemaining = Math.max(0, credits);
  const ratio = Math.min(1, safeRemaining / creditCap);
  const barPct = safeRemaining <= 0 ? 0 : Math.max(ratio * 100, 4);
  const usedPct = Math.round((1 - ratio) * 100);

  const fillColor =
    ratio >= 0.42
      ? "bg-emerald-500 dark:bg-emerald-400"
      : ratio >= 0.18
        ? "bg-amber-500 dark:bg-amber-400"
        : "bg-orange-500 dark:bg-orange-400";

  const dotColor =
    ratio >= 0.42
      ? "bg-emerald-500"
      : ratio >= 0.18
        ? "bg-amber-500"
        : "bg-orange-500";

  const planLine = planDisplayLabels[plan] ?? plan;
  const intervalBit =
    plan !== "FREE" && billingInterval
      ? billingInterval === "yearly"
        ? "Yearly"
        : "Monthly"
      : "";

  const resetHint = shortResetHint(creditsResetAt);

  return (
    <div className="rounded-xl border border-b-secondary bg-surface-sunken/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <div className={`size-1.5 rounded-full ${dotColor}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-t-secondary">
            {planLine}
          </span>
          {intervalBit && (
            <span className="text-[10px] text-t-tertiary">· {intervalBit}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onManage}
          className="rounded-md px-2 py-0.5 text-[11px] font-medium text-t-tertiary transition-colors hover:bg-surface-elevated hover:text-t-primary"
        >
          Manage
        </button>
      </div>

      {/* Credits display */}
      <div className="px-4 pb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold font-mono tabular-nums text-t-primary leading-none">
            {formatCreditsSoftLabel(safeRemaining)}
          </span>
          <span className="text-[11px] text-t-tertiary">
            / {formatCreditsSoftLabel(creditCap)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-t-tertiary/10">
          <div
            className={`h-full rounded-full ${fillColor} transition-[width] duration-1000 ease-out motion-reduce:transition-none`}
            style={{ width: `${barPct}%`, opacity: 0.6 }}
          />
        </div>
      </div>

      {/* Footer */}
      {(resetHint || usedPct > 0) && (
        <div className="flex items-center justify-between border-t border-b-secondary/60 px-4 py-2">
          <span className="text-[10px] text-t-tertiary">{usedPct}% used</span>
          {resetHint && (
            <span className="text-[10px] text-t-tertiary">{resetHint}</span>
          )}
        </div>
      )}
    </div>
  );
}

const streamingPrompts = [
  "A fitness tracker with dark theme and weekly charts",
  "E-commerce app with product cards and cart",
  "Social media feed with stories and bottom nav",
  "Music player with album art and playlist view",
];

const inspirationPrompts = [
  {
    name: "Health Dashboard",
    color: "#34d399",
    prompt:
      "Personal health dashboard. Widgets for heart rate graph, sleep quality score with moon icon, daily caloric intake vs burn, hydration water level tracker, and recovery battery percentage. Activity rings and step counter. Create also the other screens.",
  },
  {
    name: "Crypto Wallet",
    color: "#a78bfa",
    prompt:
      "Mobile dashboard, Bento Grid layout, Soft Neo-Brutalism. Dark mode, deep charcoal background, rounded cards with vivid pastel accents (salmon, periwinkle, yellow). Bold all-caps sans-serif typography, modular fintech SaaS aesthetic with high contrast. Cryptocurrency wallet dashboard. A holographic virtual credit card. Line graph visualizing asset growth displayed on a translucent floating sheet. Token list with glowing logos and frosted row backgrounds. Total balance displayed in large, luminous digits. Create also the other screens.",
  },
  {
    name: "Pet Manager",
    color: "#fb923c",
    prompt:
      "Mobile UI, Glassmorphism aesthetic. Frosted glass cards with background blur and high transparency. Gradient background. Thin 1px white borders on containers. Floating elements, 3D depth effects, glossy icons, clean white sans-serif typography. Pet management app. Pet avatars are cute, stylized drawings. Task checklist items have wobbly hand-drawn checkmarks. Feeding schedule illustrated with a smiling food bowl icon. Vet appointment cards look like little paw prints. Bright, cheerful background.",
  },
  {
    name: "Subscription Tracker",
    color: "#f472b6",
    prompt:
      "Mobile UI, Playful Whimsical aesthetic. Bright, saturated color palette (e.g., sunshine yellow, sky blue, candy pink). Hand-drawn sketch lines, organic blob shapes, uneven borders. Cute cartoon character illustrations. Bubblegum sans-serif fonts, bouncy animations, sticker-like elements. Subscription tracker dashboard. Total monthly and yearly spending displayed prominently, active subscriptions count, list of services sorted by renewal date showing service icons, names, prices and next billing dates. Create also the other screens.",
  },
  {
    name: "Clay 3D Minimal",
    color: "#fbbf24",
    prompt:
      "Mobile UI, Soft Clay 3D Minimal aesthetic. Warm pastel palette (oatmeal, soft peach, pale sage green). Claymorphism — inflated puffy 3D shapes, soft inner shadows, directional lighting. Squeezable pillowy buttons, floating bubbly cards, large border radius. Rounded sans-serif typography. Floating capsule navigation bar. Friendly, tangible, youthful.",
  },
];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function StreamingPlaceholder() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const text = streamingPrompts[promptIndex];
    let charIndex = 0;
    setDisplayed("");
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayed(text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        setTimeout(() => {
          setPromptIndex((prev) => (prev + 1) % streamingPrompts.length);
        }, 2500);
      }
    }, 40);

    return () => clearInterval(typeInterval);
  }, [promptIndex]);

  return (
    <span className="text-t-tertiary">
      {displayed}
      {isTyping && (
        <span className="relative top-[3px] ml-0.5 inline-block h-[0.95em] w-px animate-pulse bg-t-primary/35 align-baseline" />
      )}
    </span>
  );
}

interface ApiKeyEntry {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  revoked: boolean;
  createdAt: string;
  revokedAt: string | null;
}

function ApiKeysView() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [justCreated, setJustCreated] = useState<{
    id: string;
    key: string;
    name: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await http.get("/api/api-keys");
      setKeys(data.keys ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await http.post("/api/api-keys", {
        name: newKeyName.trim() || "Untitled Key",
      });
      setJustCreated({ id: data.id, key: data.key, name: data.name });
      setShowCreate(false);
      setNewKeyName("");
      fetchKeys();
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    await http.delete("/api/api-keys", { data: { id } });
    fetchKeys();
    if (justCreated?.id === id) setJustCreated(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeKeys = keys.filter((k) => !k.revoked);
  const revokedKeys = keys.filter((k) => k.revoked);

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-b-secondary px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-t-primary">
            API Keys
          </h2>
          {activeKeys.length > 0 && (
            <span className="rounded-md border border-b-secondary bg-surface-sunken px-2 py-0.5 text-[10px] font-mono tabular-nums text-t-tertiary">
              {activeKeys.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-btn-primary-bg px-4 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-btn-primary-text transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1v12M1 7h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Create key
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {justCreated && (
          <div className="mx-5 mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-emerald-400">
                  Copy your API key now
                </p>
                <p className="mt-1 text-xs text-t-tertiary">
                  You won&apos;t be able to see the full key again.
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                  <code className="flex-1 truncate text-xs text-t-primary font-mono">
                    {justCreated.key}
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(justCreated.key, justCreated.id)
                    }
                    className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-t-secondary hover:bg-input-bg hover:text-t-primary transition-colors"
                  >
                    {copiedId === justCreated.id ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJustCreated(null)}
                className="shrink-0 rounded-md p-1 text-t-tertiary hover:text-t-primary"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {showCreate && (
          <div className="mx-5 mt-5 rounded-xl border border-b-secondary bg-surface-elevated p-4">
            <label className="mb-2 block text-[11px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
              Key name
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production, Development"
              className="w-full rounded-lg border border-b-secondary bg-input-bg px-3 py-2.5 text-sm text-t-primary placeholder:text-t-tertiary outline-none focus:border-t-secondary transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setShowCreate(false);
                  setNewKeyName("");
                }
              }}
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewKeyName("");
                }}
                className="rounded-lg px-4 py-2 text-[11px] font-mono font-medium uppercase tracking-wider text-t-secondary hover:bg-input-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="rounded-lg bg-btn-primary-bg px-4 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-btn-primary-text transition-opacity disabled:opacity-50 hover:opacity-90"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        )}

        {loading && keys.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-2 text-sm text-t-tertiary">
              <div className="size-2 rounded-full bg-t-tertiary animate-pulse" />
              Loading keys...
            </div>
          </div>
        )}

        {!loading && keys.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-b-secondary bg-surface-sunken">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-t-tertiary"
              >
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-t-secondary">
              No API keys yet
            </p>
            <p className="mt-1 max-w-sm text-xs text-t-tertiary">
              Create a key to access the platform API programmatically.
            </p>
          </div>
        )}

        {activeKeys.length > 0 && (
          <div className="p-5">
            <p className="mb-3 text-[11px] font-mono font-medium uppercase tracking-wider text-t-secondary">
              Active
            </p>
            <div className="space-y-3">
              {activeKeys.map((k) => (
                <div
                  key={k.id}
                  className="group flex items-center justify-between rounded-xl border border-b-secondary bg-surface-elevated px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-b-primary/25 hover:shadow-sm dark:hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-t-primary">
                      {k.name}
                    </p>
                    <code className="mt-1 block truncate text-xs text-t-tertiary font-mono">
                      {k.key}
                    </code>
                    <p className="mt-1.5 text-[10px] text-t-tertiary/60">
                      Created{" "}
                      {new Date(k.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {k.lastUsed && (
                        <>
                          {" "}
                          &middot; Last used{" "}
                          {new Date(k.lastUsed).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(k.key, k.id)}
                      className="rounded-lg border border-b-secondary px-3 py-1.5 text-[11px] font-mono font-medium text-t-secondary hover:bg-input-bg hover:text-t-primary transition-colors"
                    >
                      {copiedId === k.id ? "Copied!" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevoke(k.id)}
                      className="rounded-lg border border-red-500/25 bg-red-500/5 px-3 py-1.5 text-[11px] font-mono font-medium text-red-500 hover:bg-red-500/15 transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {revokedKeys.length > 0 && (
          <div className="px-5 pb-5">
            <p className="mb-3 text-[11px] font-mono font-medium uppercase tracking-wider text-t-secondary">
              Revoked
            </p>
            <div className="space-y-3">
              {revokedKeys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between rounded-xl border border-b-secondary border-dashed bg-surface-sunken px-4 py-3.5 opacity-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-t-primary line-through">
                      {k.name}
                    </p>
                    <code className="mt-1 block truncate text-xs text-t-tertiary font-mono">
                      {k.key}
                    </code>
                    <p className="mt-1.5 text-[10px] text-t-tertiary/60">
                      Revoked{" "}
                      {k.revokedAt
                        ? new Date(k.revokedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                    </p>
                  </div>
                  <span className="ml-4 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-mono font-medium text-red-400">
                    Revoked
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {keys.length > 0 && (
          <div className="border-t border-b-secondary px-5 py-3">
            <p className="text-[11px] text-t-tertiary/60">
              API keys grant full access to your account. Keep them secret and
              never share them publicly.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, loading: _authLoading, signOut } = useAuth();
  const projects = useAppSelector((s) => s.projects.list);
  const loading = useAppSelector((s) => s.projects.listLoading);
  const trashedProjects = useAppSelector((s) => s.projects.trashed);
  const trashLoading = useAppSelector((s) => s.projects.trashLoading);
  const planSummary = useAppSelector((s) => s.user.plan);
  const planLoading = useAppSelector((s) => s.user.planLoading);
  const [inputValue, setInputValue] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "trash" | "api-keys">(
    "home",
  );
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [pricingDialogReason, setPricingDialogReason] = useState<
    "no_plan" | "insufficient_credits"
  >("no_plan");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    attachedImages,
    hasUploadingImages,
    fileInputRef,
    openFilePicker,
    handleFileChange: handleDashboardFileChange,
    handlePaste: handleDashboardPaste,
    removeImage: removeDashboardImage,
    clearImages,
    getUploadedUrls,
  } = useImageAttachments();

  const streamPrompt = useCallback((text: string) => {
    if (streamingRef.current) {
      clearInterval(streamingRef.current);
      streamingRef.current = null;
    }
    setActiveView("home");
    setInputValue("");
    let i = 0;
    streamingRef.current = setInterval(() => {
      if (i < text.length) {
        setInputValue(text.slice(0, i + 1));
        i++;
        const el = inputRef.current;
        if (el) {
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 240) + "px";
        }
      } else {
        if (streamingRef.current) {
          clearInterval(streamingRef.current);
          streamingRef.current = null;
        }
        inputRef.current?.focus();
      }
    }, 20);
  }, []);

  useEffect(() => {
    return () => {
      if (streamingRef.current) clearInterval(streamingRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  const shuffledInspirations = useMemo(
    () => [...inspirationPrompts].sort(() => Math.random() - 0.5),
    [],
  );

  useEffect(() => {
    if (!user) return;
    dispatch(fetchProjects());
    dispatch(fetchUserPlan());

    const onVis = () => {
      if (document.visibilityState === "visible" && user) {
        dispatch(fetchUserPlan());
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [user, dispatch]);

  const createProject = useCallback(
    async (name?: string) => {
      const prompt = name || "Untitled Project";
      setIsCreatingProject(true);
      try {
        const result = await dispatch(createProjectThunk(prompt)).unwrap();
        if (result.id) {
          const params = name ? `?prompt=${encodeURIComponent(name)}` : "";
          router.push(`/project/${result.id}${params}`);
        }
      } catch {
        setIsCreatingProject(false);
      }
    },
    [router, dispatch],
  );

  const handleSubmit = () => {
    if (!inputValue.trim() && attachedImages.length === 0) return;
    if (hasUploadingImages || isCreatingProject) return;
    if (!planSummary || planSummary.plan === "FREE") {
      setPricingDialogReason("no_plan");
      setPricingDialogOpen(true);
      return;
    }
    if (planSummary.credits <= 0) {
      setPricingDialogReason("insufficient_credits");
      setPricingDialogOpen(true);
      return;
    }
    const imageUrls = getUploadedUrls();
    if (imageUrls.length > 0) {
      sessionStorage.setItem(
        "pending_prompt_images",
        JSON.stringify(imageUrls),
      );
    }
    clearImages();
    createProject(inputValue.trim() || "Attached image");
  };

  const fetchTrash = useCallback(() => {
    dispatch(fetchTrashedProjects());
  }, [dispatch]);

  const trashProject = useCallback(
    (id: string) => {
      dispatch(trashProjectThunk(id));
    },
    [dispatch],
  );

  const restoreProject = useCallback(
    (id: string) => {
      dispatch(restoreProjectThunk(id));
    },
    [dispatch],
  );

  const permanentlyDelete = useCallback(
    (id: string) => {
      dispatch(permanentlyDeleteProject(id));
    },
    [dispatch],
  );

  const sidebarNav = [
    {
      key: "home",
      label: "Home",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      action: () => setActiveView("home"),
      active: activeView === "home",
    },
    {
      key: "trash",
      label: "Trash Projects",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      ),
      action: () => {
        setActiveView("trash");
        fetchTrash();
      },
      active: activeView === "trash",
      count: trashedProjects.length || undefined,
    },
    {
      key: "api-keys",
      label: "API Keys",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      ),
      action: () => setActiveView("api-keys"),
      active: activeView === "api-keys",
    },
  ];

  return (
    <div className="h-screen w-full bg-surface text-t-primary p-3">
      <div className="h-full w-full rounded-2xl border border-b-secondary bg-canvas-bg overflow-hidden flex relative">
        <aside className="relative z-10 flex w-[260px] flex-shrink-0 flex-col border-r border-b-secondary bg-surface/80 backdrop-blur-sm">
          <div className="flex h-14 items-center px-4">
            <Link href="/" className="no-underline flex items-center gap-2">
              <span
                className="text-base font-bold text-t-primary tracking-tight"
                style={{
                  fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
                }}
              >
                floow<span className="text-t-primary/60">.design</span>
              </span>
            </Link>
          </div>

          <div className="px-3 mb-1">
            <button
              onClick={() => {
                setActiveView("home");
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className="flex w-full items-center gap-2 rounded-lg border border-b-secondary px-3 py-2.5 text-[13px] font-medium text-t-primary transition-colors hover:bg-input-bg"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              New project
            </button>
          </div>

          <nav className="flex flex-col gap-0.5 px-3 py-2">
            {sidebarNav.map((item) => (
              <button
                key={item.key}
                onClick={item.action}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                  item.active
                    ? "bg-input-bg text-t-primary"
                    : "text-t-secondary hover:bg-input-bg hover:text-t-primary"
                }`}
              >
                <span
                  className={`transition-colors ${item.active ? "text-t-primary" : "text-t-secondary"}`}
                >
                  {item.icon}
                </span>
                {item.label}
                {item.count !== undefined && (
                  <span className="ml-auto text-xs font-mono text-t-secondary">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            <p className="mb-2 px-3 text-xs font-mono font-medium uppercase tracking-wider text-t-secondary">
              Recent
            </p>
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-t-secondary">
                <div className="size-1.5 rounded-full bg-t-secondary animate-pulse" />
                Loading...
              </div>
            ) : projects.length === 0 ? (
              <p className="px-3 text-xs text-t-secondary">No projects yet</p>
            ) : (
              projects.slice(0, 8).map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-t-primary no-underline transition-all hover:bg-input-bg"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-t-secondary"
                  >
                    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                  <span className="truncate">{project.name}</span>
                  <span className="ml-auto shrink-0 text-xs font-mono text-t-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                    {timeAgo(project.updatedAt)}
                  </span>
                </Link>
              ))
            )}
          </div>

          <div className="px-3 pb-2">
            <DashboardSidebarUsage
              summary={planSummary}
              loading={planLoading}
              onManage={() => router.push("/billing")}
            />
          </div>

          <div
            className="relative border-t border-b-secondary p-3"
            ref={userMenuRef}
          >
            {userMenuOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-xl border border-b-secondary bg-surface-elevated shadow-lg">
                <div className="px-4 py-3 border-b border-b-secondary">
                  <p className="text-[13px] font-medium text-t-primary truncate">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-xs text-t-tertiary truncate">
                    {user?.email || ""}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/billing");
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-t-secondary transition-colors hover:bg-surface-sunken hover:text-t-primary dark:hover:bg-white/[0.06]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Billing
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/account");
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-t-secondary transition-colors hover:bg-surface-sunken hover:text-t-primary dark:hover:bg-white/[0.06]"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Account
                  </button>
                </div>
                <div className="border-t border-b-secondary py-1">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs font-mono text-t-tertiary uppercase tracking-wider">
                      Theme
                    </span>
                    <ThemeToggleCompact />
                  </div>
                </div>
                <div className="border-t border-b-secondary py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut().then(() => router.replace("/signin"));
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 transition-colors hover:bg-red-500/10"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Log out
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 -mx-1 transition-colors hover:bg-surface-sunken dark:hover:bg-white/[0.05]"
            >
              <div className="flex overflow-hidden rounded-full border border-b-secondary">
                <Avatar
                  src={user?.photoURL}
                  email={user?.email}
                  name={user?.displayName}
                  size={32}
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-medium text-t-primary truncate">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs text-t-tertiary truncate">
                  {user?.email || ""}
                </p>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-t-tertiary"
              >
                <path d="M7 10l5-5 5 5" />
                <path d="M7 14l5 5 5-5" />
              </svg>
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          {activeView === "home" && (
            <div
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
          )}

          <AnimatePresence mode="wait">
            {activeView === "home" ? (
              <motion.div
                key="home"
                className="relative z-10 flex-1 flex flex-col items-center overflow-y-auto px-6 pt-[15vh] pb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="relative flex flex-col items-center text-center mb-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {[
                    {
                      x: "-60px",
                      y: "-10px",
                      size: 18,
                      color: "#fbbf24",
                      delay: 0.3,
                      rotate: -15,
                    },
                    {
                      x: "calc(100% + 40px)",
                      y: "0px",
                      size: 20,
                      color: "#a78bfa",
                      delay: 0.5,
                      rotate: 12,
                    },
                    {
                      x: "-40px",
                      y: "50px",
                      size: 14,
                      color: "#f472b6",
                      delay: 0.7,
                      rotate: 20,
                    },
                    {
                      x: "calc(100% + 25px)",
                      y: "45px",
                      size: 16,
                      color: "#34d399",
                      delay: 0.9,
                      rotate: -10,
                    },
                    {
                      x: "20px",
                      y: "-25px",
                      size: 12,
                      color: "#fb923c",
                      delay: 1.1,
                      rotate: 25,
                    },
                    {
                      x: "calc(100% - 30px)",
                      y: "-20px",
                      size: 13,
                      color: "#60a5fa",
                      delay: 0.6,
                      rotate: -20,
                    },
                  ].map((bolt, i) => (
                    <motion.div
                      key={i}
                      className="pointer-events-none absolute"
                      style={{ left: bolt.x, top: bolt.y }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.7, scale: 1 }}
                      transition={{
                        delay: bolt.delay,
                        duration: 0.4,
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                    >
                      <motion.div
                        animate={{
                          y: [0, -6, 4, -3, 0],
                          rotate: [
                            bolt.rotate,
                            bolt.rotate + 5,
                            bolt.rotate - 3,
                            bolt.rotate,
                          ],
                        }}
                        transition={{
                          duration: 6 + i,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <svg
                          width={bolt.size}
                          height={bolt.size}
                          viewBox="0 0 24 24"
                          fill={bolt.color}
                          stroke={bolt.color}
                          strokeWidth="0.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      </motion.div>
                    </motion.div>
                  ))}

                  <h1
                    className="text-3xl md:text-4xl font-semibold tracking-tight text-t-primary"
                    style={{
                      fontFamily:
                        "var(--font-logo), 'Space Grotesk', sans-serif",
                    }}
                  >
                    What would you like
                    <br />
                    <span className="text-t-tertiary">to build today?</span>
                  </h1>
                </motion.div>

                <motion.div
                  className="w-full max-w-[820px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                >
                  <div className="relative pt-3">
                    {/* Stacked card layers peeking from top */}
                    <div className="absolute inset-x-4 top-0 bottom-3 rounded-2xl border border-b-secondary/30 bg-surface-sunken/50 shadow-sm" />
                    <div className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-2xl border border-b-secondary/50 bg-surface-elevated/60 shadow-sm" />
                    <div className="relative rounded-2xl border border-b-secondary bg-surface-elevated backdrop-blur-xl shadow-lg transition-all focus-within:border-b-strong">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleDashboardFileChange}
                      />

                      {attachedImages.length > 0 && (
                        <div className="flex gap-2 px-4 pt-3 pb-0 overflow-x-auto">
                          {attachedImages.map((img) => (
                            <div
                              key={img.id}
                              className="relative shrink-0 group"
                            >
                              <img
                                src={img.dataUrl}
                                alt={img.name}
                                className={`size-16 rounded-lg object-cover border border-b-secondary transition-opacity ${
                                  img.uploading
                                    ? "opacity-50"
                                    : img.error
                                      ? "opacity-40"
                                      : ""
                                }`}
                              />
                              {img.uploading && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="animate-spin text-t-secondary"
                                  >
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="9"
                                      stroke="currentColor"
                                      strokeOpacity="0.25"
                                      strokeWidth="2.5"
                                    />
                                    <path
                                      d="M12 3a9 9 0 0 1 9 9"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </div>
                              )}
                              {img.error && !img.uploading && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                                  <span className="text-[10px] font-medium text-red-500 bg-surface-elevated/80 rounded px-1">
                                    Failed
                                  </span>
                                </div>
                              )}
                              {img.url && !img.uploading && !img.error && <></>}
                              <button
                                type="button"
                                onClick={() => removeDashboardImage(img.id)}
                                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-surface-elevated border border-b-secondary text-t-tertiary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-t-primary"
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="px-4 pt-4 pb-2 relative">
                        {!inputValue && attachedImages.length === 0 && (
                          <div className="absolute inset-x-4 top-4 pointer-events-none text-[15px] leading-relaxed">
                            <StreamingPlaceholder />
                          </div>
                        )}
                        <textarea
                          ref={inputRef}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit();
                            }
                          }}
                          onPaste={handleDashboardPaste}
                          disabled={isCreatingProject}
                          rows={3}
                          className="w-full bg-transparent text-[15px] text-t-primary placeholder-transparent outline-none resize-none leading-relaxed min-h-[100px] max-h-[240px] relative z-10 disabled:opacity-50"
                          onInput={(e) => {
                            const el = e.currentTarget;
                            el.style.height = "auto";
                            el.style.height =
                              Math.min(el.scrollHeight, 240) + "px";
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={openFilePicker}
                            className="inline-flex size-7 items-center justify-center rounded-md text-t-tertiary hover:text-t-secondary hover:bg-surface-sunken dark:hover:bg-white/[0.06] transition-colors"
                            title="Attach image"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                              />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={
                              (!inputValue.trim() &&
                                attachedImages.length === 0) ||
                              hasUploadingImages ||
                              isCreatingProject
                            }
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-btn-primary-bg text-btn-primary-text shadow-sm outline-none transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
                          >
                            {isCreatingProject ? (
                              <div className="size-4 animate-spin rounded-full border-2 border-btn-primary-text border-t-transparent" />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="1em"
                                height="1em"
                                fill="currentColor"
                                viewBox="0 0 256 256"
                                className="size-4"
                              >
                                <path d="M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-2 overflow-x-auto max-w-full flex-nowrap">
                    <span className="text-[11px] font-mono text-t-tertiary uppercase tracking-wider mr-1">
                      Try
                    </span>
                    {shuffledInspirations.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => streamPrompt(item.prompt)}
                        className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full border border-b-secondary bg-surface-elevated px-3 py-1.5 text-[11px] font-medium text-t-secondary transition-all hover:bg-surface-sunken hover:text-t-primary dark:hover:bg-white/[0.06]"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0"
                        >
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        {item.name}
                      </button>
                    ))}
                  </div>
                </motion.div>

                {projects.length > 0 && (
                  <motion.div
                    className="w-full max-w-[880px] mt-10 rounded-2xl border border-b-secondary bg-surface-elevated/60 backdrop-blur-xl p-5 sm:p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-t-secondary">
                        Recent projects
                      </h2>
                      <span className="text-[10px] font-mono text-t-tertiary">
                        {projects.length} project
                        {projects.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {projects.map((project) => (
                        <article
                          key={project.id}
                          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-b-secondary bg-surface-elevated shadow-sm transition-all hover:-translate-y-1 hover:border-b-strong hover:shadow-lg"
                        >
                          <div className="relative aspect-[16/9] w-full min-h-0 border-b border-b-secondary/80 bg-surface-sunken">
                            <Link
                              href={`/project/${project.id}`}
                              className="relative block h-full min-h-0 w-full overflow-hidden"
                            >
                              <ProjectFramePreview
                                title={project.name}
                                framePreviews={project.framePreviews}
                              />
                            </Link>
                            <button
                              type="button"
                              className="absolute right-1.5 top-1.5 z-10 flex size-7 items-center justify-center rounded-md border border-b-secondary bg-surface/90 text-t-tertiary shadow-sm backdrop-blur-sm transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100"
                              title="Move to trash"
                              onClick={() => trashProject(project.id)}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </button>
                          </div>
                          <Link
                            href={`/project/${project.id}`}
                            className="flex flex-col justify-center gap-1 px-4 py-3 no-underline"
                          >
                            <p className="line-clamp-1 text-sm font-semibold text-t-primary">
                              {project.name}
                            </p>
                            <p className="text-[11px] font-mono text-t-tertiary">
                              {project.screens} screen
                              {project.screens !== 1 ? "s" : ""} ·{" "}
                              {timeAgo(project.updatedAt)}
                            </p>
                          </Link>
                        </article>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : activeView === "trash" ? (
              <motion.div
                key="trash"
                className="relative z-10 flex-1 flex flex-col overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-b-secondary px-5 py-4">
                  <h2 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-t-primary">
                    Trash
                  </h2>
                  {trashedProjects.length > 0 && (
                    <span className="rounded-md border border-b-secondary bg-surface-sunken px-2 py-0.5 text-[10px] font-mono tabular-nums text-t-tertiary">
                      {trashedProjects.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {trashLoading ? (
                    <div className="flex items-center justify-center py-24">
                      <div className="flex items-center gap-2 text-sm text-t-tertiary">
                        <div className="size-2 rounded-full bg-t-tertiary animate-pulse" />
                        Loading trash…
                      </div>
                    </div>
                  ) : trashedProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
                      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-b-secondary bg-surface-sunken">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-t-tertiary/70"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-t-secondary">
                        Trash is empty
                      </p>
                      <p className="mt-1 max-w-sm text-xs text-t-tertiary">
                        Deleted projects appear here until you restore or remove
                        them for good.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-4">
                      {trashedProjects.map((project) => (
                        <article
                          key={project.id}
                          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-b-secondary border-dashed bg-surface-sunken transition-all hover:-translate-y-0.5 hover:border-b-primary/20 hover:bg-surface-elevated"
                        >
                          <div className="relative aspect-[16/10] w-full min-h-0 border-b border-b-secondary/80 bg-surface-sunken">
                            <ProjectFramePreview
                              title={project.name}
                              emptyLabel={`${project.screens} screens`}
                              dimmed
                            />
                          </div>
                          <div className="flex min-h-[124px] flex-col gap-3 px-4 py-3">
                            <div>
                              <p className="line-clamp-2 text-sm font-medium text-t-secondary line-through decoration-t-tertiary/50">
                                {project.name}
                              </p>
                              <p className="mt-1 text-[11px] font-mono text-t-tertiary">
                                Trashed {timeAgo(project.trashedAt)}
                              </p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <button
                                type="button"
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-b-secondary bg-surface-elevated px-3 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-t-secondary transition-colors hover:border-b-primary/30 hover:bg-surface-sunken hover:text-t-primary dark:hover:bg-white/[0.06]"
                                title="Restore"
                                onClick={() => restoreProject(project.id)}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="1 4 1 10 7 10" />
                                  <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                                </svg>
                                Restore
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/5 px-3 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-red-500 transition-colors hover:bg-red-500/15"
                                title="Delete permanently"
                                onClick={() => permanentlyDelete(project.id)}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeView === "api-keys" ? (
              <motion.div
                key="api-keys"
                className="relative z-10 flex-1 flex flex-col overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ApiKeysView />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <PricingDialog
        open={pricingDialogOpen}
        onClose={() => setPricingDialogOpen(false)}
        reason={pricingDialogReason}
      />
    </div>
  );
}
