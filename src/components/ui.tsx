"use client";

import type { ReactNode } from "react";
import { TRACKS } from "@/lib/roadmap";
import type { Track } from "@/lib/types";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-slate-900/60 shadow-lg shadow-black/20 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

export function TrackBadge({ track }: { track: Track }) {
  const t = TRACKS[track];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${t.soft} ${t.text}`}
    >
      {t.label}
    </span>
  );
}

export function ProgressBar({
  value,
  total,
  barClass = "bg-indigo-400",
  className = "",
}: {
  value: number;
  total: number;
  barClass?: string;
  className?: string;
}) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-white/[0.07] ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${barClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Ring({
  pct,
  size = 148,
  stroke = 12,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, pct)) / 100}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: ReactNode;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "sky";
}) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-400/10 text-indigo-300",
    emerald: "bg-emerald-400/10 text-emerald-300",
    amber: "bg-amber-400/10 text-amber-300",
    rose: "bg-rose-400/10 text-rose-300",
    sky: "bg-sky-400/10 text-sky-300",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <span className={`rounded-lg p-2 ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
        checked
          ? "border-emerald-400 bg-emerald-400 text-slate-900"
          : "border-slate-600 bg-transparent hover:border-indigo-400"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
