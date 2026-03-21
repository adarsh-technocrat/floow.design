"use client";

import { useState } from "react";
import Link from "next/link";

const recentProjects = [
  {
    id: "1",
    name: "Health Tracker",
    updatedAt: "2 hours ago",
    screens: 8,
    thumbnail:
      "https://lh3.googleusercontent.com/CwGQkERZQIadMhpEphW3k58HmhCs02NQRYpR9L_GIhU7qHIDfQlJp-ykadYDGA-x6_Bkq_Ea2r-fFr3rv4kW8Xw9A1DgJuD9hlE5Fw",
  },
  {
    id: "2",
    name: "Social Media App",
    updatedAt: "Yesterday",
    screens: 12,
    thumbnail:
      "https://lh3.googleusercontent.com/-MMEDlQhYVE8CLSReq5dD_9s_mXvDaJUB8HaM-gKSh4LUsgjpQOK3ov7qdaH7hsVFDF0rc3L6Hi1ppWlaWx-rYMhK8IAViAM-Gk",
  },
  {
    id: "3",
    name: "E-Commerce Store",
    updatedAt: "3 days ago",
    screens: 15,
    thumbnail:
      "https://lh3.googleusercontent.com/D6d1SQF0r3pePXE2e02y5nuvncVNFlQTMLmJm8ycWnjxC0Re9wQdvjQWHgcYYpduzGd7_QrfUTjC-OBUjDHOf_vWQ7fkMSRyEwhJ",
  },
  {
    id: "4",
    name: "Fitness Dashboard",
    updatedAt: "5 days ago",
    screens: 6,
    thumbnail:
      "https://lh3.googleusercontent.com/7zm0iGoJpEdqqpo4GoqcLdOn0k-s9ZEMVy4MYn6Ia_3_FLlOzKHpb2iLlq7mVaLN7E4_5raueLuya7-MuvUyWFILPxBSdhTTz1XN",
  },
  {
    id: "5",
    name: "Food Delivery",
    updatedAt: "1 week ago",
    screens: 10,
    thumbnail:
      "https://lh3.googleusercontent.com/kpKlgqVM9HpnzkABysl_zNiUI-dgwj1kzHnRnh1qkwyxedx6b7dqHkTnNa8cvACvifn2lIHWb95KStpEgveKsl621OibIwFtkky-Ng=w1200",
  },
];

const templates = [
  { id: "t1", name: "Blank Project", icon: "+" },
  { id: "t2", name: "Social App", icon: "💬" },
  { id: "t3", name: "E-Commerce", icon: "🛍" },
  { id: "t4", name: "Health & Fitness", icon: "💪" },
  { id: "t5", name: "Finance", icon: "💰" },
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filteredProjects = recentProjects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside className="hidden w-[260px] flex-shrink-0 flex-col border-r border-white/[0.08] bg-[#0a0a0a] md:flex">
        <div className="flex h-14 items-center gap-2 px-5">
          <span
            className="text-base font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-logo), 'Space Grotesk', sans-serif" }}
          >
            launchpad<span className="text-white/50">.ai</span>
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3 pt-2">
          <SidebarItem icon={<HomeIcon />} label="Home" active />
          <SidebarItem icon={<ProjectsIcon />} label="Projects" />
          <SidebarItem icon={<TemplatesIcon />} label="Templates" />
          <SidebarItem icon={<StarIcon />} label="Starred" />
          <SidebarItem icon={<TrashIcon />} label="Trash" />

          <div className="my-4 h-px bg-white/[0.08]" />

          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-white/30">
            Teams
          </p>
          <SidebarItem icon={<TeamIcon />} label="Personal" />
          <SidebarItem icon={<TeamIcon />} label="Launchpad AI Team" />
        </nav>

        <div className="border-t border-white/[0.08] p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">Adarsh Kumar</p>
              <p className="truncate text-xs text-white/40">Free plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] px-6">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M7 12A5 5 0 107 2a5 5 0 000 10zM13 13l-3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-9 pr-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("grid")}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                view === "grid"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                view === "list"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <div className="ml-2 h-5 w-px bg-white/[0.08]" />

            <Link
              href="/app?view=canvas"
              className="ml-2 flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-black hover:bg-white/90 transition-colors no-underline"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              New Project
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Quick start */}
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-medium text-white/50">
              Start from a template
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {templates.map((t) => (
                <Link
                  key={t.id}
                  href="/app?view=canvas"
                  className="group flex h-24 w-32 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] transition-all hover:border-white/20 hover:bg-white/[0.06] no-underline"
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-xs text-white/60 group-hover:text-white/80">
                    {t.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent projects */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-white/50">
                Recent projects
              </h2>
              <button className="text-xs text-white/40 hover:text-white/70 transition-colors">
                View all
              </button>
            </div>

            {view === "grid" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProjects.map((project) => (
                  <Link
                    key={project.id}
                    href="/app?view=canvas"
                    className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] transition-all hover:border-white/15 hover:bg-white/[0.05] no-underline"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.02]">
                      <img
                        alt={project.name}
                        src={project.thumbnail}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {project.name}
                        </p>
                        <p className="mt-0.5 text-xs text-white/40">
                          {project.screens} screens &middot; {project.updatedAt}
                        </p>
                      </div>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white/60 group-hover:opacity-100"
                        onClick={(e) => e.preventDefault()}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="3" r="1" fill="currentColor" />
                          <circle cx="7" cy="7" r="1" fill="currentColor" />
                          <circle cx="7" cy="11" r="1" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredProjects.map((project) => (
                  <Link
                    key={project.id}
                    href="/app?view=canvas"
                    className="group flex items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-white/[0.04] no-underline"
                  >
                    <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-md bg-white/[0.05]">
                      <img
                        alt={project.name}
                        src={project.thumbnail}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {project.name}
                      </p>
                    </div>
                    <p className="text-xs text-white/30">
                      {project.screens} screens
                    </p>
                    <p className="w-24 text-right text-xs text-white/30">
                      {project.updatedAt}
                    </p>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 opacity-0 transition-all hover:bg-white/10 hover:text-white/60 group-hover:opacity-100"
                      onClick={(e) => e.preventDefault()}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="3" r="1" fill="currentColor" />
                        <circle cx="7" cy="7" r="1" fill="currentColor" />
                        <circle cx="7" cy="11" r="1" fill="currentColor" />
                      </svg>
                    </button>
                  </Link>
                ))}
              </div>
            )}

            {filteredProjects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-white/40">No projects found</p>
                <p className="mt-1 text-xs text-white/25">
                  Try a different search term
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors ${
        active
          ? "bg-white/[0.08] font-medium text-white"
          : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function TemplatesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="8" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="8" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5l1.85 3.75 4.15.6-3 2.93.71 4.12L8 10.87 4.29 12.9l.71-4.12-3-2.93 4.15-.6L8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 4h11M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M12 4v8.5a1 1 0 01-1 1H5a1 1 0 01-1-1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
