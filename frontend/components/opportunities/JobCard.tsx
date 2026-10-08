"use client";

import { useState } from "react";
import { DECISION_META } from "@/lib/obliqo/scoring";
import { formatHours } from "@/lib/obliqo/learning";
import type { Job, JobAnalysis } from "@/lib/obliqo/types";

const SEVERITY: Record<string, string> = {
  high: "border-red-300 bg-red-50 text-red-800",
  medium: "border-amber-300 bg-amber-50 text-amber-800",
  low: "border-gray-300 bg-gray-50 text-gray-700",
};
const PRIORITY: Record<string, string> = { High: "text-red-700", Medium: "text-amber-700", Low: "text-gray-600" };

function Bar({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600"><span>{label} <span className="text-gray-400">({weight})</span></span><span>{value}%</span></div>
      <div className="h-1.5 rounded bg-gray-200"><div className="h-1.5 rounded bg-indigo-500" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

export default function JobCard({ job, analysis, onDelete, onPlan }: { job: Job; analysis: JobAnalysis; onDelete: () => void; onPlan: () => void }) {
  const [open, setOpen] = useState(false);
  const meta = DECISION_META[analysis.decision];
  const a = analysis;
  const ageDays = Math.max(0, Math.floor((Date.now() - job.postedAt) / 86_400_000));

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{job.url ? <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{job.title}</a> : job.title}</h3>
          <p className="text-sm text-gray-600">{job.company} · {job.location || job.mode} · {job.mode} · {job.level} · posted {ageDays}d ago</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{a.score}%</div>
          <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${meta.classes}`}>{meta.icon} {meta.label}</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-700">{a.decisionReason}</p>

      <button onClick={() => setOpen(!open)} className="mt-2 text-sm text-indigo-600 hover:underline">{open ? "Hide details" : "Why this score?"}</button>

      {open && (
        <div className="mt-3 space-y-4 border-t pt-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <Bar label="Semantic similarity" value={a.breakdown.semantic} weight="40%" />
            <Bar label="Skill overlap" value={a.breakdown.skills} weight="30%" />
            <Bar label="Experience alignment" value={a.breakdown.experience} weight="20%" />
            <Bar label="Preferences" value={a.breakdown.preferences} weight="10%" />
          </div>

          <div>
            <p className="mb-1 font-medium">Skills</p>
            <div className="flex flex-wrap gap-1">
              {a.matchedSkills.map((s) => <span key={s} className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">✓ {s}</span>)}
              {a.missingSkills.map((s) => <span key={s} className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">⚠ {s}</span>)}
              {!a.requiredSkills.length && <span className="text-xs text-gray-500">No concrete skills found in this posting.</span>}
            </div>
          </div>

          {a.strengths.length > 0 && (
            <div><p className="mb-1 font-medium">💪 Your strengths</p><ul className="list-disc pl-5 text-gray-700">{a.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
          )}

          {a.risks.length > 0 && (
            <div className="space-y-1">
              <p className="font-medium">🚨 Risk factors</p>
              {a.risks.map((r) => <div key={r.type} className={`rounded border px-2 py-1 ${SEVERITY[r.severity]}`}><span className="font-medium capitalize">{r.type.replace(/_/g, " ")}</span>: {r.message}</div>)}
            </div>
          )}

          {a.gaps.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Skill gaps</p>
              {a.gaps.map((g) => (
                <div key={g.skill} className="rounded border p-2">
                  <div className="flex justify-between"><span className="font-medium">{g.skill}</span><span className={PRIORITY[g.priority]}>{g.priority} priority · {formatHours(g.estimatedHours)}</span></div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
                    {g.resources.map((r) => <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{r.label}</a>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="mb-1 font-medium">Competition: <span className="capitalize">{a.competition.level}</span> ({a.competition.score}/100)</p>
            <ul className="list-disc pl-5 text-gray-700">{a.competition.factors.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-3 text-sm">
        {a.gaps.length > 0 && <button onClick={onPlan} className="rounded bg-indigo-600 px-3 py-1 text-white">Create learning plan</button>}
        <button onClick={onDelete} className="text-red-600 hover:underline">Remove</button>
      </div>
    </div>
  );
}
