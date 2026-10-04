"use client";

import { useMemo } from "react";
import { useProgress } from "@/components/ProgressProvider";
import {
  roadmap,
  taskId,
  roadmapDayFor,
  TOTAL_DAYS,
  TOTAL_TASKS,
  TOTAL_WEEKS,
  TRACK_ORDER,
} from "./roadmap";
import type { Track } from "./types";

export interface Counts {
  done: number;
  total: number;
}

export function useStats() {
  const { completed, startDate } = useProgress();

  return useMemo(() => {
    const dayCounts: Record<number, Counts> = {};
    const weekCounts: Record<number, Counts> = {};
    const trackCounts = Object.fromEntries(
      TRACK_ORDER.map((t) => [t, { done: 0, total: 0 }]),
    ) as Record<Track, Counts>;

    let tasksDone = 0;
    let hoursDone = 0;
    let hoursTotal = 0;

    for (const d of roadmap.days) {
      const total = d.tasks.length;
      let done = 0;
      d.tasks.forEach((_, i) => {
        if (completed[taskId(d.day, i)]) done++;
      });
      dayCounts[d.day] = { done, total };
      (weekCounts[d.week] ??= { done: 0, total: 0 }).done += done;
      weekCounts[d.week].total += total;
      trackCounts[d.track].done += done;
      trackCounts[d.track].total += total;
      tasksDone += done;
      hoursTotal += d.hours;
      hoursDone += total ? (d.hours * done) / total : 0;
    }

    const isDayDone = (n: number) => {
      const c = dayCounts[n];
      return !!c && c.total > 0 && c.done === c.total;
    };

    let daysCompleted = 0;
    for (let n = 1; n <= TOTAL_DAYS; n++) if (isDayDone(n)) daysCompleted++;

    const started = startDate !== null;
    const rawDay = started ? roadmapDayFor(startDate) : 0;
    const status: "not-started" | "waiting" | "active" | "finished" = !started
      ? "not-started"
      : rawDay < 1
        ? "waiting"
        : rawDay > TOTAL_DAYS
          ? "finished"
          : "active";
    const todayDay = Math.min(Math.max(rawDay, 1), TOTAL_DAYS);

    /** days before today with unfinished tasks (what you still owe) */
    const overdue: number[] = [];
    if (status === "active" || status === "finished") {
      const upTo = status === "finished" ? TOTAL_DAYS : todayDay - 1;
      for (let n = 1; n <= upTo; n++) if (!isDayDone(n)) overdue.push(n);
    }
    const overdueTasks = overdue.reduce(
      (s, n) => s + (dayCounts[n].total - dayCounts[n].done),
      0,
    );

    /** consecutive fully-completed roadmap days up to today (or yesterday) */
    let streak = 0;
    if (status === "active" || status === "finished") {
      let n = isDayDone(todayDay) ? todayDay : todayDay - 1;
      while (n >= 1 && isDayDone(n)) {
        streak++;
        n--;
      }
    }

    const daysRemainingCalendar =
      status === "active" ? TOTAL_DAYS - todayDay : status === "waiting" ? TOTAL_DAYS : 0;

    return {
      status,
      todayDay,
      rawDay,
      dayCounts,
      weekCounts,
      trackCounts,
      tasksDone,
      tasksTotal: TOTAL_TASKS,
      tasksRemaining: TOTAL_TASKS - tasksDone,
      pct: TOTAL_TASKS ? Math.round((tasksDone / TOTAL_TASKS) * 100) : 0,
      daysCompleted,
      daysTotal: TOTAL_DAYS,
      daysRemainingCalendar,
      weeksTotal: TOTAL_WEEKS,
      currentWeek: Math.ceil(todayDay / 7),
      overdue,
      overdueTasks,
      streak,
      hoursDone: Math.round(hoursDone * 10) / 10,
      hoursTotal: Math.round(hoursTotal * 10) / 10,
      isDayDone,
    };
  }, [completed, startDate]);
}
