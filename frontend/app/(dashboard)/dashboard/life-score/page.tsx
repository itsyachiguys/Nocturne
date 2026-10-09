"use client";

import Link from "next/link";
import { UI } from "@/lib/obliqo/ui";
import { useLifeScore } from "@/lib/lifescore/useLifeScore";
import { WEIGHTS, type PartKey } from "@/lib/lifescore/calculator";
import ScoreRing, { scoreColor } from "@/components/lifescore/ScoreRing";
import { PART_NAMES } from "@/components/lifescore/LifeScoreCard";

const HINTS: Record<PartKey, string> = {
  attendance: "Mark classes as present or absent on the Attendance page.",
  syllabus: "Update your progress on each subject.",
  cgpa: "Enter your current CGPA in your profile.",
  activities: "Add courses and extracurriculars on the Activities page.",
};

export default function LifeScorePage() {
  const { loading, signedOut, error, result, inputs } = useLifeScore();

  if (signedOut) return <div className={`${UI.card} p-6 text-sm`}>Please sign in to see your Life Score.</div>;
  if (error) return <div className={`${UI.card} p-6 text-sm text-rose-600`}>Couldn&apos;t load your Life Score: {error}. Check that your Firestore rules allow reading your own data.</div>;
  if (loading || !result) return <div className={`${UI.card} p-6 text-sm ${UI.muted}`}>Loading your Life Score...</div>;

  const keys = Object.keys(PART_NAMES) as PartKey[];
  const missing = keys.filter((k) => !result.parts[k].has);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/dashboard" className={`text-sm ${UI.muted} hover:underline`}>Back to dashboard</Link>

      <section className={`${UI.card} flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left`}>
        <ScoreRing score={result.score} label={result.label} size={140} />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold" style={{ color: scoreColor(result.score) }}>{result.label}</h1>
          <p className={`text-sm ${UI.muted}`}>Your Life Score combines syllabus progress, CGPA, courses and extracurriculars, and attendance. Attendance counts the least.</p>
        </div>
      </section>

      {missing.length > 0 && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          This score uses {keys.length - missing.length} of {keys.length} inputs. Missing inputs are left out rather than counted as zero.
          <ul className="mt-1 list-disc pl-5">{missing.map((k) => <li key={k}><strong>{PART_NAMES[k]}:</strong> {HINTS[k]}</li>)}</ul>
        </div>
      )}

      <section className={`${UI.card} divide-y divide-slate-200 dark:divide-white/10`} aria-label="Score breakdown">
        {keys.map((k) => {
          const p = result.parts[k];
          return (
            <div key={k} className="space-y-2 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-medium">{PART_NAMES[k]} <span className={`text-xs font-normal ${UI.muted}`}>{WEIGHTS[k]}% of score</span></h2>
                <span className="tabular-nums text-sm">{p.has ? `${p.percent.toFixed(0)}%` : "No data"}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10" role="presentation">
                <div className="h-1.5 rounded-full motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${p.has ? p.percent : 0}%`, background: scoreColor(p.percent) }} />
              </div>
              <div className={`text-xs tabular-nums ${UI.muted}`}>
                {p.has ? `${p.points.toFixed(1)} of ${p.maxPoints.toFixed(1)} points` : "Not counted yet"}
                {k === "activities" && inputs ? ` · ${inputs.activitiesDone} of ${inputs.activitiesTotal} completed` : ""}
                {k === "activities" && <> · <Link href="/dashboard/activities" className="underline">Manage</Link></>}
              </div>
            </div>
          );
        })}
      </section>

      {inputs && inputs.subjects === 0 && <p className={`text-sm ${UI.muted}`}>No subjects found yet. Add your subjects to start tracking attendance and syllabus progress.</p>}
    </div>
  );
}
