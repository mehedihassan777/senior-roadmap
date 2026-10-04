export type Track =
  | "dsa"
  | "sysdesign"
  | "dotnet"
  | "nextjs"
  | "angular"
  | "devops"
  | "database"
  | "behavioral"
  | "review";

export type TaskKind = "learn" | "practice" | "build" | "review";

export interface RoadmapTask {
  text: string;
  kind?: TaskKind;
}

export interface RoadmapDay {
  day: number;
  week: number;
  title: string;
  track: Track;
  hours: number;
  summary: string;
  tasks: RoadmapTask[];
  resources: string[];
}

export interface RoadmapWeek {
  week: number;
  title: string;
  goal: string;
}

export interface RoadmapPhase {
  id: number;
  name: string;
  weeks: number[];
  goal: string;
}

export interface RoadmapData {
  meta: { title: string; totalDays: number; totalWeeks: number };
  phases: RoadmapPhase[];
  weeks: RoadmapWeek[];
  days: RoadmapDay[];
}
