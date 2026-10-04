import { notFound } from "next/navigation";
import { DayView } from "@/components/DayView";
import { getDay, TOTAL_DAYS } from "@/lib/roadmap";

export function generateStaticParams() {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => ({ day: String(i + 1) }));
}

export default async function DayPage({ params }: PageProps<"/day/[day]">) {
  const { day } = await params;
  const n = Number(day);
  if (!Number.isInteger(n) || !getDay(n)) notFound();
  return <DayView day={n} />;
}
