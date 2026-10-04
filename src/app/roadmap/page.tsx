"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useProgress } from "@/components/ProgressProvider";
import { Card, ProgressBar, TrackBadge } from "@/components/ui";
import { useStats } from "@/lib/stats";
import { addDays, daysOfWeek, formatDate, roadmap, TRACKS, TRACK_ORDER } from "@/lib/roadmap";
import type { Track } from "@/lib/types";

export default function RoadmapPage() {
  const { startDate } = useProgress();
  const s = useStats();
  const [track, setTrack] = useState<Track | "all">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<number, boolean>>({ [s.currentWeek]: true });

  const q = query.trim().toLowerCase();

  const weeks = useMemo(
    () =>
      roadmap.weeks
        .map((w) => ({
          ...w,
          days: daysOfWeek(w.week).filter(
            (d) =>
              (track === "all" || d.track === track) &&
              (!q || d.title.toLowerCase().includes(q) || d.tasks.some((t) => t.text.toLowerCase().includes(q))),
          ),
        }))
        .filter((w) => w.days.length > 0),
    [track, q],
  );

  const filtering = track !== "all" || q !== "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Roadmap</h1>
        <p className="mt-1 text-slate-400">
          {roadmap.meta.totalWeeks} weeks, {roadmap.meta.totalDays} days, 2-3 hours a day.
        </p>
      </div>

      {/* phases */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {roadmap.phases.map((p) => {
          const done = p.weeks.reduce((n, w) => n + (s.weekCounts[w]?.done ?? 0), 0);
          const total = p.weeks.reduce((n, w) => n + (s.weekCounts[w]?.total ?? 0), 0);
          return (
            <Card key={p.id} className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-300">
                Phase {p.id} &middot; W{p.weeks[0]}-{p.weeks[p.weeks.length - 1]}
              </p>
              <p className="mt-1 text-sm font-bold text-white">{p.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{p.goal}</p>
              <ProgressBar value={done} total={total} className="mt-3" barClass="bg-gradient-to-r from-indigo-400 to-emerald-400" />
            </Card>
          );
        })}
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search days and tasks…"
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...TRACK_ORDER] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTrack(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                track === t ? "bg-indigo-500 text-white" : "bg-white/[0.06] text-slate-400 hover:text-white"
              }`}
            >
              {t === "all" ? "All" : TRACKS[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* weeks */}
      <div className="space-y-3">
        {weeks.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No matches.</p>}
        {weeks.map((w) => {
          const c = s.weekCounts[w.week] ?? { done: 0, total: 0 };
          const isOpen = filtering || open[w.week];
          const isCurrent = s.status === "active" && w.week === s.currentWeek;
          return (
            <Card key={w.week} className={isCurrent ? "ring-1 ring-indigo-400/50" : ""}>
              <button
                onClick={() => setOpen((o) => ({ ...o, [w.week]: !o[w.week] }))}
                className="flex w-full items-center gap-4 p-4 text-left sm:p-5"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                    c.total > 0 && c.done === c.total ? "bg-emerald-400 text-slate-950" : "bg-indigo-500/15 text-indigo-200"
                  }`}
                >
                  {c.total > 0 && c.done === c.total ? <Check className="h-5 w-5" /> : `W${w.week}`}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-white sm:text-base">{w.title}</span>
                    {isCurrent && (
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-200">
                        Current
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{w.goal}</span>
                  <ProgressBar value={c.done} total={c.total} className="mt-2 h-1.5" barClass="bg-emerald-400" />
                </span>
                <span className="hidden text-xs text-slate-500 sm:block">
                  {c.done}/{c.total}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <ul className="space-y-1.5 border-t border-white/[0.06] p-3 sm:p-4">
                  {w.days.map((d) => {
                    const dc = s.dayCounts[d.day];
                    const done = dc.total > 0 && dc.done === dc.total;
                    return (
                      <li key={d.day}>
                        <Link
                          href={`/day/${d.day}`}
                          className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.05]"
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                              done ? "bg-emerald-400 text-slate-950" : dc.done > 0 ? "bg-amber-400/20 text-amber-200" : "bg-white/[0.06] text-slate-400"
                            }`}
                          >
                            {done ? <Check className="h-4 w-4" /> : d.day}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm font-medium ${done ? "text-slate-500 line-through" : "text-slate-200"}`}>
                              {d.title}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {startDate ? `${formatDate(addDays(startDate, d.day - 1))} · ` : ""}
                              {dc.done}/{dc.total} tasks &middot; ~{d.hours}h
                            </span>
                          </span>
                          <TrackBadge track={d.track} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
