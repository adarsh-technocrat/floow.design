"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Crown,
  Eye,
  Share2,
  LogOut,
  CreditCard,
  User as UserIcon,
  Users,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { ThemeToggleCompact } from "@/components/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { PreviewModal } from "./PreviewModal";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";

const btnClass =
  "inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-mono font-medium uppercase tracking-wider text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary disabled:pointer-events-none disabled:opacity-40";

type CanvasTopRightProps = {
  compact?: boolean;
};

export function CanvasTopRight({ compact = false }: CanvasTopRightProps) {
  const router = useRouter();
  const params = useParams();
  const projectId = (params?.id ?? params?.projectId) as string | undefined;
  const { user, signOut } = useAuth();
  const selectedFrameIds = useAppSelector((s) => s.canvas.selectedFrameIds);
  const frames = useAppSelector((s) => s.canvas.frames);

  const [profileOpen, setProfileOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile menu on click outside
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  // Preview — open mobile preview overlay
  const handlePreview = () => {
    if (frames.length === 0) {
      toast.error("No frames to preview", { position: "top-center" });
      return;
    }
    setPreviewOpen(true);
  };

  // Share — copy project link to clipboard
  const handleShare = () => {
    if (!projectId) return;
    const url = `${window.location.origin}/project/${projectId}`;
    navigator.clipboard.writeText(url);
    toast.success("Project link copied to clipboard", {
      position: "top-center",
    });
  };

  // Upgrade — go to pricing
  const handleUpgrade = () => {
    router.push("/pricing");
  };

  return (
    <div
      className={`absolute right-0 top-0 z-20 flex items-center gap-1 ${
        compact ? "h-9 px-2" : "h-12 px-4"
      }`}
    >
      <button
        type="button"
        className={
          compact
            ? "inline-flex size-7 items-center justify-center rounded-md text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary disabled:pointer-events-none disabled:opacity-40"
            : btnClass
        }
        title="Preview"
        onClick={handlePreview}
      >
        <Eye className="size-3.5" />
        {!compact && <span>Preview</span>}
      </button>

      <button
        type="button"
        className={
          compact
            ? "inline-flex size-7 items-center justify-center rounded-md text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary disabled:pointer-events-none disabled:opacity-40"
            : btnClass
        }
        title="Share"
        onClick={handleShare}
      >
        <Share2 className="size-3.5" />
        {!compact && <span>Share</span>}
      </button>

      <div className="mx-1 h-4 w-px bg-b-primary" />

      {compact ? (
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1 rounded-md border border-b-secondary px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-t-primary transition-colors hover:bg-input-bg"
          title="Buy Credits"
          onClick={handleUpgrade}
        >
          <Crown className="size-3.5" />
          <span>Buy Credits</span>
        </button>
      ) : (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-b-secondary px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-t-primary hover:bg-input-bg transition-colors"
          title="Upgrade"
          onClick={handleUpgrade}
        >
          <Crown className="size-3.5" />
          <span>Upgrade</span>
        </button>
      )}

      <div className="mx-1 h-4 w-px bg-b-primary" />

      <div className={compact ? "scale-[0.95]" : ""}>
        <ThemeToggleCompact />
      </div>

      {/* Profile button + dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className="inline-flex size-8 items-center justify-center rounded-full border border-b-secondary text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary overflow-hidden"
          aria-label="User profile"
        >
          {user?.photoURL ? (
            <Avatar
              src={user.photoURL}
              email={user.email}
              name={user.displayName}
              size={32}
            />
          ) : (
            <UserIcon className="size-4" />
          )}
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-[240px] overflow-hidden rounded-xl border border-b-secondary bg-surface-elevated shadow-lg backdrop-blur-xl">
            {/* User info */}
            <div className="px-4 py-3 border-b border-b-secondary">
              <div className="flex items-center gap-2.5">
                <div className="shrink-0 overflow-hidden rounded-full border border-b-secondary">
                  <Avatar
                    src={user?.photoURL}
                    email={user?.email}
                    name={user?.displayName}
                    size={32}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-t-primary truncate">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-[11px] text-t-tertiary truncate">
                    {user?.email || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/dashboard");
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary"
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/team");
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary"
              >
                <Users className="size-4" />
                Team
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/billing");
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary"
              >
                <CreditCard className="size-4" />
                Billing
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/account");
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-t-secondary transition-colors hover:bg-input-bg hover:text-t-primary"
              >
                <Settings className="size-4" />
                Account
              </button>
            </div>

            {/* Theme */}
            <div className="border-t border-b-secondary px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-t-tertiary uppercase tracking-wider">
                  Theme
                </span>
                <ThemeToggleCompact />
              </div>
            </div>

            {/* Sign out */}
            <div className="border-t border-b-secondary py-1">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  signOut().then(() => router.replace("/signin"));
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        initialFrameId={selectedFrameIds[0]}
      />
    </div>
  );
}
