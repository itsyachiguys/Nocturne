"use client";

import Link from "next/link";
import { UI } from "@/lib/obliqo/ui";
import { useLifeScore } from "@/lib/lifescore/useLifeScore";
import type { PartKey } from "@/lib/lifescore/calculator";
import ScoreRing from "./ScoreRing";

export const PART_NAMES: Record<PartKey, string> = {
  syllabus: "Syllabus",
  cgpa: "CGPA",
  activities: "Courses & activities",
  career: "Career (Obliqo)",
  attendance: "Attendance",
};

/** Dashboard card. Drop <LifeScoreCard /> anywhere inside the signed-in dashboard. */
export default function LifeScoreCard() {
  const { loading, signedOut, error, result } = useLifeScore();

  if (signedOut) return null;
  if (error) return <div className={`${UI.card} p-4 text-sm text-rose-600`}>Couldn&apos;t load your Life Score: {error}</div>;
  if (loading || !result) return <div className={`${UI.card} p-4 text-sm ${UI.muted}`}>Loading your Life Score...</div>;

  return (
    <section className={`${UI.card} flex items-center gap-4 p-4`} aria-label="Student Life Score">
      <ScoreRing score={result.score} label={result.label} />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <h2 className="font-semibold">Life Score: {result.label}</h2>
          {result.partial && <p className={`text-xs ${UI.muted}`}>Based on the data you&apos;ve added so far.</p>}
        </div>
        <ul className="space-y-1 text-xs">
          {(Object.keys(PART_NAMES) as PartKey[]).map((k) => (
            <li key={k} className="flex items-center justify-between gap-2">
              <span className={UI.muted}>{PART_NAMES[k]}</span>
              <span className="tabular-nums">{result.parts[k].has ? `${Math.round(result.parts[k].percent)}%` : "No data"}</span>
            </li>
          ))}
        </ul>
        <Link href="/dashboard/life-score" className="inline-block text-sm text-violet-600 underline dark:text-violet-300">See breakdown</Link>
      </div>
    </section>
  );
}
