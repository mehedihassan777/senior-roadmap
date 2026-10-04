"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProgress } from "@/components/ProgressProvider";
import { useStats } from "@/lib/stats";

/** /today -> /day/<current roadmap day> (or the dashboard if not started) */
export default function TodayRedirect() {
  const router = useRouter();
  const { ready } = useProgress();
  const s = useStats();

  useEffect(() => {
    if (!ready) return;
    router.replace(s.status === "not-started" ? "/" : `/day/${s.todayDay}`);
  }, [ready, s.status, s.todayDay, router]);

  return <p className="py-20 text-center text-sm text-slate-500">Finding today&apos;s plan…</p>;
}
