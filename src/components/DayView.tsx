"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCheck, ExternalLink, PlayCircle, RotateCcw } from "lucide-react";
import { useProgress } from "./ProgressProvider";
import { TaskList } from "./TaskList";
import { Card, ProgressBar, TrackBadge } from "./ui";
import { useStats } from "@/lib/stats";
import { addDays, formatDate, getDay, phaseOfWeek, roadmap, TOTAL_DAYS } from "@/lib/roadmap";

export function DayView({ day }: { day: number }) {
  const d = getDay(day)!;
  const { startDate, notes, saveNote, setDayDone, ready } = useProgress();
  const s = useStats();
  const c = s.dayCounts[day];
  const allDone = c.total > 0 && c.done === c.total;
  const week = roadmap.weeks.find((w) => w.week === d.week);
  const phase = phaseOfWeek(d.week);
  const isToday = s.status === "active" && s.todayDay === day;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 text-sm">
        <Link href="/roadmap" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Roadmap
        </Link>
        <div className="flex gap-2">
          <NavBtn to={day - 1} label="Prev" dir="prev" />
          <NavBtn to={day + 1} label="Next" dir="next" />
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <TrackBadge track={d.track} />
          {isToday && (
            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-indigo-200">Today</span>
          )}
          {allDone && (
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-emerald-300">Done</span>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Day {day} of {TOTAL_DAYS}
          {startDate && <> &middot; {formatDate(addDays(startDate, day - 1))}</>}
          {week && <> &middot; Week {week.week}: {week.title}</>}
          {phase && <> &middot; {phase.name}</>}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">{d.title}</h1>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-400">{d.summary}</p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <div className="min-w-[200px] flex-1">
            <ProgressBar value={c.done} total={c.total} barClass="bg-gradient-to-r from-indigo-400 to-emerald-400" className="h-2.5" />
            <p className="mt-1.5 text-xs text-slate-500">
              {c.done}/{c.total} tasks &middot; ~{d.hours}h
            </p>
          </div>
          {allDone ? (
            <button
              onClick={() => setDayDone(day, false)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <RotateCcw className="h-4 w-4" /> Reset day
            </button>
          ) : (
            <button
              onClick={() => setDayDone(day, true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <CheckCheck className="h-4 w-4" /> Mark day complete
            </button>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <h2 className="mb-4 text-lg font-bold text-white">Tasks</h2>
          <TaskList day={d} />
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-white">Search &amp; resources</h2>
            <p className="mt-1 text-xs text-slate-500">Click to search on YouTube or Google.</p>
            <ul className="mt-4 space-y-2">
              {d.resources.map((r) => (
                <li key={r} className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 text-sm text-slate-300">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{r}</span>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(r)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Search YouTube"
                    className="rounded-md p-1.5 text-rose-300 hover:bg-white/10"
                  >
                    <PlayCircle className="h-4 w-4" />
                  </a>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(r)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Search Google"
                    className="rounded-md p-1.5 text-sky-300 hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </Card>

          {ready && <NoteBox key={day} day={day} initial={notes[day] ?? ""} onSave={saveNote} />}
        </div>
      </div>
    </div>
  );
}

function NavBtn({ to, label, dir }: { to: number; label: string; dir: "prev" | "next" }) {
  const disabled = to < 1 || to > TOTAL_DAYS;
  const cls =
    "inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 font-medium text-slate-300 transition";
  if (disabled) return <span className={`${cls} opacity-30`}>{label}</span>;
  return (
    <Link href={`/day/${to}`} className={`${cls} hover:bg-white/10 hover:text-white`}>
      {dir === "prev" && <ArrowLeft className="h-3.5 w-3.5" />}
      {label}
      {dir === "next" && <ArrowRight className="h-3.5 w-3.5" />}
    </Link>
  );
}

/** Notes autosave 800ms after you stop typing. Remount (key=day) resets the draft per day. */
function NoteBox({ day, initial, onSave }: { day: number; initial: string; onSave: (day: number, note: string) => void }) {
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ text, saved: true });
  useEffect(() => {
    latest.current = { text, saved };
  }, [text, saved]);

  // flush a pending save when leaving the day
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (!latest.current.saved) onSave(day, latest.current.text);
    },
    [day, onSave],
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Notes</h2>
        <span className="text-xs text-slate-500">{saved ? "Saved" : "Saving…"}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
          if (timer.current) clearTimeout(timer.current);
          const v = e.target.value;
          timer.current = setTimeout(() => {
            onSave(day, v);
            setSaved(true);
          }, 800);
        }}
        rows={7}
        placeholder="Key takeaways, problems you got stuck on, links…"
        className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400"
      />
    </Card>
  );
}
