"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface CreditLogEntry {
  id: string;
  action: string;
  amount: number;
  balance: number;
  projectId: string | null;
  meta: string | null;
  createdAt: string;
}

const actionLabels: Record<string, string> = {
  design: "AI Design",
  chat: "AI Chat",
  reset: "Credits Refreshed",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CreditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<CreditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 30;

  const fetchLogs = useCallback(
    async (newOffset: number) => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/user/credits?userId=${user.uid}&limit=${limit}&offset=${newOffset}`,
        );
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setOffset(newOffset);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    fetchLogs(0);
  }, [fetchLogs]);

  return (
    <div className="h-screen w-full bg-surface text-t-primary p-3">
      <div className="h-full w-full rounded-2xl border border-b-secondary bg-canvas-bg overflow-hidden flex flex-col relative">
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <header className="relative z-10 flex h-12 items-center justify-between px-5 border-b border-b-secondary">
          <Link
            href="/billing"
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-t-tertiary hover:text-t-secondary transition-colors no-underline"
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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Billing
          </Link>
          <span className="text-[11px] font-mono text-t-tertiary uppercase tracking-wider">
            Credit Usage
          </span>
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-2xl">
            <h1
              className="text-xl font-semibold tracking-tight text-t-primary mb-6"
              style={{
                fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif",
              }}
            >
              Credit Usage Log
            </h1>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-t-tertiary py-8">
                <div className="size-2 rounded-full bg-t-tertiary animate-pulse" />
                Loading...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-t-tertiary">No credit activity yet</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-b-secondary overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-b-secondary bg-input-bg/50">
                        <th className="text-left px-4 py-2.5 text-[11px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
                          Date
                        </th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
                          Action
                        </th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
                          Credits
                        </th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-mono font-medium uppercase tracking-wider text-t-tertiary">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-b-secondary last:border-b-0"
                        >
                          <td className="px-4 py-3 text-xs text-t-secondary">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-t-primary">
                              {actionLabels[log.action] || log.action}
                            </span>
                            {log.meta && (
                              <p className="text-[11px] text-t-tertiary mt-0.5">
                                {log.meta}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`text-xs font-mono font-medium ${
                                log.amount > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-t-secondary"
                              }`}
                            >
                              {log.amount > 0 ? "+" : ""}
                              {log.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-mono text-t-tertiary">
                            {log.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {total > limit && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-[11px] font-mono text-t-tertiary">
                      Showing {offset + 1}–{Math.min(offset + limit, total)} of{" "}
                      {total}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchLogs(Math.max(0, offset - limit))}
                        disabled={offset === 0}
                        className="rounded-md border border-b-secondary px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-t-secondary transition-colors hover:bg-input-bg disabled:opacity-30"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => fetchLogs(offset + limit)}
                        disabled={offset + limit >= total}
                        className="rounded-md border border-b-secondary px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-t-secondary transition-colors hover:bg-input-bg disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
