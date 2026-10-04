import raw from "@/data/roadmap.json";
import type { RoadmapData, RoadmapDay, Track } from "./types";

export const roadmap = raw as unknown as RoadmapData;

export const TOTAL_DAYS = roadmap.days.length;
export const TOTAL_WEEKS = roadmap.weeks.length;

export const TOTAL_TASKS = roadmap.days.reduce((n, d) => n + d.tasks.length, 0);

export const taskId = (day: number, idx: number) => `d${day}-t${idx}`;

export const getDay = (day: number): RoadmapDay | undefined =>
  roadmap.days.find((d) => d.day === day);

export const daysOfWeek = (week: number) =>
  roadmap.days.filter((d) => d.week === week);

export const phaseOfWeek = (week: number) =>
  roadmap.phases.find((p) => p.weeks.includes(week));

export interface TrackMeta {
  label: string;
  /** text colour for badges / icons */
  text: string;
  /** soft tinted background for badges */
  soft: string;
  /** solid bar colour */
  bar: string;
  /** border accent */
  border: string;
}

export const TRACKS: Record<Track, TrackMeta> = {
  dsa: {
    label: "DSA",
    text: "text-sky-300",
    soft: "bg-sky-400/10 ring-sky-400/30",
    bar: "bg-sky-400",
    border: "border-sky-400/40",
  },
  sysdesign: {
    label: "System Design",
    text: "text-emerald-300",
    soft: "bg-emerald-400/10 ring-emerald-400/30",
    bar: "bg-emerald-400",
    border: "border-emerald-400/40",
  },
  dotnet: {
    label: ".NET",
    text: "text-violet-300",
    soft: "bg-violet-400/10 ring-violet-400/30",
    bar: "bg-violet-400",
    border: "border-violet-400/40",
  },
  nextjs: {
    label: "Next.js",
    text: "text-zinc-200",
    soft: "bg-zinc-300/10 ring-zinc-300/30",
    bar: "bg-zinc-300",
    border: "border-zinc-300/40",
  },
  angular: {
    label: "Angular",
    text: "text-rose-300",
    soft: "bg-rose-400/10 ring-rose-400/30",
    bar: "bg-rose-400",
    border: "border-rose-400/40",
  },
  devops: {
    label: "DevOps",
    text: "text-orange-300",
    soft: "bg-orange-400/10 ring-orange-400/30",
    bar: "bg-orange-400",
    border: "border-orange-400/40",
  },
  database: {
    label: "Database",
    text: "text-amber-300",
    soft: "bg-amber-400/10 ring-amber-400/30",
    bar: "bg-amber-400",
    border: "border-amber-400/40",
  },
  behavioral: {
    label: "Behavioral",
    text: "text-pink-300",
    soft: "bg-pink-400/10 ring-pink-400/30",
    bar: "bg-pink-400",
    border: "border-pink-400/40",
  },
  review: {
    label: "Review",
    text: "text-teal-300",
    soft: "bg-teal-400/10 ring-teal-400/30",
    bar: "bg-teal-400",
    border: "border-teal-400/40",
  },
};

export const TRACK_ORDER = Object.keys(TRACKS) as Track[];

/* ---------- date helpers (all local-time, 'YYYY-MM-DD' strings) ---------- */

export const todayStr = () => toDateStr(new Date());

export function toDateStr(d: Date) {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDateStr(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number) {
  const d = parseDateStr(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

const MS_DAY = 86_400_000;

/** whole days between two date strings (b - a) */
export function diffDays(a: string, b: string) {
  const da = parseDateStr(a);
  const db = parseDateStr(b);
  return Math.round(
    (Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) -
      Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) /
      MS_DAY,
  );
}

/** 1-based roadmap day for today (can be <1 before start or >TOTAL_DAYS after) */
export function roadmapDayFor(start: string, today = todayStr()) {
  return diffDays(start, today) + 1;
}

export function formatDate(s: string) {
  return parseDateStr(s).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
