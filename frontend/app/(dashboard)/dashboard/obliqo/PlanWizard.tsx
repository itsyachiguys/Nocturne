"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/obliqo/ui";
import { LEVEL_NAMES, type Level } from "@/lib/obliqo/matching";
import { buildRoadmap, hasHandWrittenRoadmap, type Roadmap } from "@/lib/obliqo/roadmaps";

const HOURS = [0.5, 1, 2, 3, 4];
const DAYS = [3, 4, 5, 6, 7];
const LEVEL_TEXT: Record<Level, string> = {
  1: "Understand the fundamentals and build small things on your own.",
  2: "Build real projects and handle everyday job tasks with confidence.",
  3: "Design, optimise and ship production-grade work.",
};

/** Two questions (daily hours, target level), then a detailed roadmap is built for that skill. */
export default function PlanWizard({ skill, initial, onClose, onCreate }: {
  skill: string;
  initial?: { hoursPerDay: number; daysPerWeek: number; goal: Level };
  onClose: () => void;
  onCreate: (r: Roadmap) => void;
}) {
  const [step, setStep] = useState<0 | 1>(0);
  const [hpd, setHpd] = useState(String(initial?.hoursPerDay ?? 2));
  const [dpw, setDpw] = useState(initial?.daysPerWeek ?? 5);
  const [goal, setGoal] = useState<Level>(initial?.goal ?? 2);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hours = Math.min(12, Math.max(0.5, Number(hpd) || 0));
  const valid = Number(hpd) >= 0.5 && Number(hpd) <= 12;
  const pace = { hoursPerDay: hours, daysPerWeek: dpw };
  const preview = (lv: Level) => buildRoadmap(skill, lv, pace);
  const chip = (on: boolean) => `${UI.chip} !px-3 !py-1.5 text-sm ${on ? "border-violet-500 bg-violet-600 text-white" : "border-slate-300 hover:border-violet-400 dark:border-white/15"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`Plan ${skill}`} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl dark:border-white/10 dark:bg-slate-900 dark:text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className={`text-xs ${UI.muted}`}>Plan {skill} · question {step + 1} of 2</div>
            <h2 className="text-lg font-semibold">{step === 0 ? `How much time can you give to ${skill}?` : `What level do you want to reach in ${skill}?`}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500" aria-label="Close">✕</button>
        </div>

        {step === 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Hours per day</div>
              <div className="flex flex-wrap items-center gap-2">
                {HOURS.map((h) => <button key={h} className={chip(Number(hpd) === h)} onClick={() => setHpd(String(h))}>{h} h</button>)}
                <input type="number" min={0.5} max={12} step={0.5} value={hpd} onChange={(e) => setHpd(e.target.value)} className={`${UI.input} !w-20`} aria-label="Custom hours per day" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Days per week</div>
              <div className="flex flex-wrap gap-2">{DAYS.map((d) => <button key={d} className={chip(dpw === d)} onClick={() => setDpw(d)}>{d}</button>)}</div>
            </div>
            <div className={`text-xs ${UI.muted}`}>That is about {Math.round(hours * dpw * 10) / 10} hours a week.</div>
            <button className={`${UI.btn} ${UI.btnPrimary} w-full`} disabled={!valid} onClick={() => setStep(1)}>Next</button>
            {!valid && <div className="text-xs text-rose-600">Enter between 0.5 and 12 hours per day.</div>}
          </div>
        ) : (
          <div className="space-y-3">
            {([1, 2, 3] as Level[]).map((lv) => {
              const r = preview(lv);
              return (
                <button key={lv} onClick={() => setGoal(lv)} className={`w-full rounded-xl border p-3 text-left ${goal === lv ? "border-violet-500 bg-violet-500/10" : "border-slate-200 hover:border-violet-400 dark:border-white/10"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{LEVEL_NAMES[lv]}</span>
                    <span className={`text-xs ${UI.muted}`}>about {r.totalHours} h · {r.weeks} week{r.weeks === 1 ? "" : "s"}</span>
                  </div>
                  <div className={`text-sm ${UI.muted}`}>{LEVEL_TEXT[lv]}</div>
                </button>
              );
            })}
            {!hasHandWrittenRoadmap(skill) && <div className={`text-xs ${UI.muted}`}>{skill} uses a general three-level roadmap. You can edit every step afterwards.</div>}
            <div className="flex gap-2">
              <button className={`${UI.btn} ${UI.btnGhost}`} onClick={() => setStep(0)}>Back</button>
              <button className={`${UI.btn} ${UI.btnPrimary} flex-1`} onClick={() => onCreate(buildRoadmap(skill, goal, pace))}>Create my roadmap</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
