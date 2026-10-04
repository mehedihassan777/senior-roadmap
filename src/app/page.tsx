"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Flame,
  Hourglass,
  ListChecks,
  PartyPopper,
  Rocket,
} from "lucide-react";
import { useProgress } from "@/components/ProgressProvider";
import { TaskList } from "@/components/TaskList";
import { Card, ProgressBar, Ring, StatCard, TrackBadge } from "@/components/ui";
import { useStats } from "@/lib/stats";
import {
  addDays,
  formatDate,
  getDay,
  phaseOfWeek,
  roadmap,
  todayStr,
  TOTAL_DAYS,
  TRACKS,
  TRACK_ORDER,
} from "@/lib/roadmap";

export default function Dashboard() {
  const { ready, startDate, setStartDate } = useProgress();
  const s = useStats();

  if (!ready) return <Skeleton />;

  if (s.status === "not-started") return <StartCard onStart={setStartDate} />;

  const today = getDay(s.todayDay)!;
  const phase = phaseOfWeek(today.week);
  const dateOfToday = startDate ? addDays(startDate, s.todayDay - 1) : todayStr();

  return (
    <div className="space-y-6">
      {/* hero */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
          <Ring pct={s.pct}>
            <span className="text-4xl font-extrabold text-white">{s.pct}%</span>
            <span className="text-xs text-slate-400">complete</span>
          </Ring>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-indigo-300">
              {s.status === "waiting"
                ? `Starts ${formatDate(startDate!)}`
                : s.status === "finished"
                  ? "Roadmap period finished"
                  : formatDate(dateOfToday)}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Day {s.todayDay} <span className="text-slate-500">of {TOTAL_DAYS}</span>
            </h1>
            <p className="mt-2 text-slate-400">
              Week {s.currentWeek} of {s.weeksTotal}
              {phase && <> &middot; Phase {phase.id}: {phase.name}</>}
            </p>
            <div className="mt-4">
              <ProgressBar
                value={s.todayDay}
                total={TOTAL_DAYS}
                className="h-2.5"
                barClass="bg-gradient-to-r from-indigo-400 to-emerald-400"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                {s.daysRemainingCalendar} calendar days left &middot; {s.daysCompleted}/{s.daysTotal} days fully completed
              </p>
            </div>
            <Link
              href={`/day/${s.todayDay}`}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Open today&apos;s plan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Card>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Completed" value={s.tasksDone} sub={`of ${s.tasksTotal} tasks`} icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
        <StatCard
          label="Pending (overdue)"
          value={s.overdueTasks}
          sub={s.overdue.length ? `across ${s.overdue.length} past day${s.overdue.length > 1 ? "s" : ""}` : "You're on track"}
          icon={<AlertCircle className="h-4 w-4" />}
          tone={s.overdueTasks ? "rose" : "emerald"}
        />
        <StatCard label="Remaining" value={s.tasksRemaining} sub="tasks to go" icon={<ListChecks className="h-4 w-4" />} tone="sky" />
        <StatCard label="Days left" value={s.daysRemainingCalendar} sub={`day ${s.todayDay} / ${TOTAL_DAYS}`} icon={<Hourglass className="h-4 w-4" />} tone="indigo" />
        <StatCard label="Streak" value={`${s.streak}d`} sub="fully completed days" icon={<Flame className="h-4 w-4" />} tone="amber" />
        <StatCard label="Study hours" value={s.hoursDone} sub={`of ~${s.hoursTotal}h planned`} icon={<Clock className="h-4 w-4" />} tone="indigo" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* today */}
        <Card className="p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-white">Today &middot; {today.title}</h2>
            <TrackBadge track={today.track} />
            <span className="ml-auto text-xs text-slate-500">~{today.hours}h</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{today.summary}</p>
          <div className="mt-4">
            <TaskList day={today} />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {s.dayCounts[today.day].done}/{s.dayCounts[today.day].total} done today
          </p>
        </Card>

        {/* pending */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-rose-300" />
            <h2 className="text-lg font-bold text-white">Pending days</h2>
          </div>
          {s.overdue.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center text-sm text-slate-400">
              <PartyPopper className="h-8 w-8 text-emerald-300" />
              Nothing overdue. Keep the streak going.
            </div>
          ) : (
            <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
              {s.overdue.map((n) => {
                const d = getDay(n)!;
                const c = s.dayCounts[n];
                return (
                  <li key={n}>
                    <Link
                      href={`/day/${n}`}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition hover:border-rose-400/40 hover:bg-white/[0.05]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-400/10 text-xs font-bold text-rose-300">
                        {n}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-200">{d.title}</span>
                        <span className="block text-xs text-slate-500">
                          {c.total - c.done} of {c.total} tasks left
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-600" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* tracks */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-white">Progress by topic</h2>
        <div className="mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {TRACK_ORDER.map((t) => {
            const c = s.trackCounts[t];
            if (!c.total) return null;
            return (
              <div key={t}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className={`font-semibold ${TRACKS[t].text}`}>{TRACKS[t].label}</span>
                  <span className="text-xs text-slate-500">
                    {c.done}/{c.total}
                  </span>
                </div>
                <ProgressBar value={c.done} total={c.total} barClass={TRACKS[t].bar} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* heatmap */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-white">140-day map</h2>
          <Legend />
        </div>
        <div className="mt-5 space-y-1.5 overflow-x-auto pb-1">
          {roadmap.weeks.map((w) => (
            <div key={w.week} className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-[10px] font-medium text-slate-500">W{w.week}</span>
              <div className="flex gap-1.5">
                {roadmap.days
                  .filter((d) => d.week === w.week)
                  .map((d) => {
                    const c = s.dayCounts[d.day];
                    const done = c.total > 0 && c.done === c.total;
                    const partial = c.done > 0 && !done;
                    const isToday = d.day === s.todayDay && s.status === "active";
                    const overdue = s.overdue.includes(d.day);
                    return (
                      <Link
                        key={d.day}
                        href={`/day/${d.day}`}
                        title={`Day ${d.day}: ${d.title} (${c.done}/${c.total})`}
                        className={`h-6 w-6 rounded-md transition hover:scale-110 sm:h-7 sm:w-7 ${
                          done
                            ? "bg-emerald-400"
                            : partial
                              ? "bg-amber-400/70"
                              : overdue
                                ? "bg-rose-400/40"
                                : "bg-white/[0.07]"
                        } ${isToday ? "ring-2 ring-indigo-300 ring-offset-2 ring-offset-slate-900" : ""}`}
                      />
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <StartDateEditor key={startDate} current={startDate!} onSave={setStartDate} />
    </div>
  );
}

function Legend() {
  const items = [
    ["bg-emerald-400", "Done"],
    ["bg-amber-400/70", "In progress"],
    ["bg-rose-400/40", "Overdue"],
    ["bg-white/[0.07]", "Upcoming"],
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
      {items.map(([c, l]) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded ${c}`} />
          {l}
        </span>
      ))}
    </div>
  );
}

function StartCard({ onStart }: { onStart: (d: string) => void }) {
  const [date, setDate] = useState(todayStr());
  return (
    <Card className="mx-auto mt-10 max-w-xl p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-400 text-slate-950">
        <Rocket className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-white">Ready to start your {TOTAL_DAYS}-day roadmap?</h1>
      <p className="mt-2 text-sm text-slate-400">
        Pick your Day 1. Every device reads the same start date, so the day count matches at home and at the office.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-400"
        />
        <button
          onClick={() => date && onStart(date)}
          className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          Start roadmap
        </button>
      </div>
    </Card>
  );
}

function StartDateEditor({ current, onSave }: { current: string; onSave: (d: string) => void }) {
  const [date, setDate] = useState(current);
  return (
    <Card className="flex flex-wrap items-center gap-4 p-5">
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">Start date</p>
        <p className="text-xs text-slate-500">Day 1 of the roadmap. Changing it shifts every day&apos;s calendar date; your ticks stay.</p>
      </div>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
      />
      <button
        disabled={!date || date === current}
        onClick={() => onSave(date)}
        className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:bg-white/20 disabled:opacity-40"
      >
        Save
      </button>
    </Card>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-56 rounded-2xl bg-white/[0.05]" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/[0.05]" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-white/[0.05]" />
    </div>
  );
}
