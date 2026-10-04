"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { CalendarDays, Cloud, CloudOff, Compass, LayoutDashboard, Map, RefreshCw, TriangleAlert, X } from "lucide-react";
import { useProgress } from "./ProgressProvider";
import { useStats } from "@/lib/stats";
import { ProgressBar } from "./ui";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/roadmap", label: "Roadmap", icon: Map },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, syncEnabled, syncMessage, syncStatus, dismissSyncMessage } = useProgress();
  const stats = useStats();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/roadmap" && pathname.startsWith("/day"));

  return (
    <div className="min-h-screen lg:flex">
      {/* sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r border-white/[0.07] bg-slate-950/60 p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 text-slate-950">
            <Compass className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-white">Senior Engineer</span>
            <span className="block text-xs text-slate-400">Interview Roadmap</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive(href)
                  ? "bg-indigo-500/15 text-indigo-200"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          {ready && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="flex items-baseline justify-between text-xs text-slate-400">
                <span>Overall</span>
                <span className="font-semibold text-white">{stats.pct}%</span>
              </div>
              <ProgressBar value={stats.tasksDone} total={stats.tasksTotal} className="mt-2" barClass="bg-gradient-to-r from-indigo-400 to-emerald-400" />
              <p className="mt-2 text-[11px] text-slate-500">
                {stats.tasksDone}/{stats.tasksTotal} tasks
              </p>
            </div>
          )}
          <SyncButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* top bar (mobile) */}
        <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-slate-950/85 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 text-slate-950">
                <Compass className="h-4 w-4" />
              </span>
              Roadmap
            </Link>
            <div className="flex items-center gap-3">
              {ready && <span className="text-xs font-semibold text-emerald-300">{stats.pct}%</span>}
              <SyncButton compact />
            </div>
          </div>
          <nav className="flex gap-1 px-3 pb-2">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium ${
                  isActive(href) ? "bg-indigo-500/15 text-indigo-200" : "text-slate-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
          {!syncEnabled && !syncMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <strong>Saved locally in this browser.</strong> Sync isn&apos;t connected on this device yet, so home and office won&apos;t match. Press the Sync button and enter your sync passcode.
                It then merges this device&apos;s progress with the database and keeps the latest.
              </p>
            </div>
          )}
          {syncMessage && (
            <div
              className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                syncStatus === "error"
                  ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-100"
              }`}
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1">{syncMessage}</p>
              <button onClick={dismissSyncMessage} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {children}
        </main>
        <PasscodeDialog />
      </div>
    </div>
  );
}

function timeAgo(t: number) {
  const sec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (sec < 45) return "just now";
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  return `${Math.round(sec / 86400)}d ago`;
}

function SyncButton({ compact = false }: { compact?: boolean }) {
  const { syncStatus, sync, lastSyncedAt, pendingChanges, syncEnabled } = useProgress();
  const syncing = syncStatus === "syncing";

  const tone = !syncEnabled
    ? "bg-amber-400/10 text-amber-300 ring-amber-400/30 hover:bg-amber-400/20"
    : syncStatus === "error"
      ? "bg-rose-400/10 text-rose-300 ring-rose-400/30 hover:bg-rose-400/20"
      : pendingChanges > 0 || syncing
        ? "bg-indigo-400/10 text-indigo-200 ring-indigo-400/30 hover:bg-indigo-400/20"
        : "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30 hover:bg-emerald-400/20";

  const label = !syncEnabled
    ? "Sync (not connected)"
    : syncing
      ? "Syncing…"
      : syncStatus === "error"
        ? "Sync failed - retry"
        : pendingChanges > 0
          ? `Sync now (${pendingChanges})`
          : lastSyncedAt
            ? `Synced ${timeAgo(lastSyncedAt)}`
            : "Sync now";

  const compactLabel = syncing ? "…" : syncEnabled && pendingChanges > 0 ? `Sync (${pendingChanges})` : "Sync";
  const Icon = !syncEnabled ? CloudOff : syncing ? RefreshCw : Cloud;

  return (
    <button
      onClick={() => void sync()}
      disabled={syncing}
      title={syncEnabled ? "Merge with the database and keep the latest" : "Not connected: click to enter your sync passcode"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 ring-inset transition ${tone} ${compact ? "" : "w-full"}`}
    >
      <Icon className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
      {compact ? compactLabel : label}
    </button>
  );
}

function PasscodeDialog() {
  const { passcodePromptOpen, closePasscodePrompt, submitPasscode, syncMessage } = useProgress();
  const [value, setValue] = useState("");
  if (!passcodePromptOpen) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitPasscode(value);
    setValue("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={closePasscodePrompt}>
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-white">Connect sync</h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter the <code className="rounded bg-black/30 px-1">SYNC_PASSCODE</code> you set in your environment (Vercel or <code className="rounded bg-black/30 px-1">.env.local</code>).
          It is stored only in this browser. Your progress stays saved locally either way.
        </p>
        {syncMessage && <p className="mt-3 text-sm text-amber-200">{syncMessage}</p>}
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Sync passcode"
          className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-400"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={closePasscodePrompt} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">
            Not now
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:bg-indigo-400 disabled:opacity-40"
          >
            Connect &amp; sync
          </button>
        </div>
      </form>
    </div>
  );
}
