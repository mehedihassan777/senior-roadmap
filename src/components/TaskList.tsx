"use client";

import { useProgress } from "./ProgressProvider";
import { Checkbox } from "./ui";
import { taskId } from "@/lib/roadmap";
import type { RoadmapDay, TaskKind } from "@/lib/types";

const KIND_STYLE: Record<TaskKind, string> = {
  learn: "bg-sky-400/10 text-sky-300",
  practice: "bg-violet-400/10 text-violet-300",
  build: "bg-orange-400/10 text-orange-300",
  review: "bg-teal-400/10 text-teal-300",
};

export function TaskList({ day }: { day: RoadmapDay }) {
  const { completed, toggleTask } = useProgress();
  return (
    <ul className="space-y-2">
      {day.tasks.map((t, i) => {
        const done = !!completed[taskId(day.day, i)];
        return (
          <li
            key={i}
            className={`flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition hover:bg-white/[0.04] ${
              done ? "opacity-60" : ""
            }`}
          >
            <Checkbox checked={done} onChange={() => toggleTask(day.day, i)} label={t.text} />
            <button
              type="button"
              onClick={() => toggleTask(day.day, i)}
              className={`flex-1 text-left text-sm leading-relaxed ${
                done ? "text-slate-500 line-through" : "text-slate-200"
              }`}
            >
              {t.text}
            </button>
            {t.kind && (
              <span
                className={`hidden shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline ${KIND_STYLE[t.kind] ?? ""}`}
              >
                {t.kind}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
