"use client";

import { useState } from "react";
import { DECISION_META } from "@/lib/obliqo/scoring";
import { formatHours } from "@/lib/obliqo/learning";
import type { Job, JobAnalysis } from "@/lib/obliqo/types";
import { DECISION_STYLE, H4, scoreColor } from "./styles";

const SEVERITY: Record<string, string> = {
  high: "border-coral/30 bg-coral/10 text-coral",
  medium: "border-pastel-orange/30 bg-pastel-orange/10 text-pastel-orange",
  low: "border-line bg-surface-alt text-ink-secondary dark:border-line-dark dark:bg-surface-alt-dark dark:text-ink-secondary-dark",
};
const PRIORITY: Record<string, string> = {
  High: "text-coral",
  Medium: "text-pastel-orange",
  Low: "text-ink-secondary dark:text-ink-secondary-dark",
};
const SECTION = "mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark";

function Bar({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink-secondary dark:text-ink-secondary-dark">
        <span>{label} <span className="text-ink-muted dark:text-ink-muted-dark">({weight})</span></span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-alt dark:bg-surface-alt-dark">
        <div className="h-2 rounded-full bg-brand-gradient" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function JobCard({ job, analysis, onDelete, onPlan }: { job: Job; analysis: JobAnalysis; onDelete: () => void; onPlan: () => void }) {
  const [open, setOpen] = useState(false);
  const meta = DECISION_META[analysis.decision];
  const a = analysis;
  const ageDays = Math.max(0, Math.floor((Date.now() - job.postedAt) / 86_400_000));

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className={`truncate ${H4}`}>
            {job.url ? <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{job.title}</a> : job.title}
          </h3>
          <p className="mt-1 text-xs text-ink-secondary dark:text-ink-secondary-dark">
            {job.company} · {job.location || job.mode} · {job.mode} · {job.level} · posted {ageDays}d ago
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className={`font-display text-3xl font-bold ${scoreColor(a.score)}`}>{a.score}%</div>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${DECISION_STYLE[a.decision]}`}>{meta.icon} {meta.label}</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-secondary dark:text-ink-secondary-dark">{a.decisionReason}</p>

      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-3 text-sm font-semibold text-lavender-dark hover:underline">
        {open ? "Hide details" : "Why this score?"}
      </button>

      {open && (
        <div className="mt-4 space-y-5 border-t border-line pt-4 text-sm dark:border-line-dark">
          <div className="grid gap-3 sm:grid-cols-2">
            <Bar label="Semantic similarity" value={a.breakdown.semantic} weight="40%" />
            <Bar label="Skill overlap" value={a.breakdown.skills} weight="30%" />
            <Bar label="Experience alignment" value={a.breakdown.experience} weight="20%" />
            <Bar label="Preferences" value={a.breakdown.preferences} weight="10%" />
          </div>

          <div>
            <p className={SECTION}>Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {a.matchedSkills.map((s) => <span key={s} className="rounded-full bg-mint/10 px-2.5 py-0.5 text-xs font-semibold text-mint">✓ {s}</span>)}
              {a.missingSkills.map((s) => <span key={s} className="rounded-full bg-pastel-orange/10 px-2.5 py-0.5 text-xs font-semibold text-pastel-orange">⚠ {s}</span>)}
              {!a.requiredSkills.length && <span className="text-xs text-ink-secondary dark:text-ink-secondary-dark">No concrete skills found in this posting.</span>}
            </div>
          </div>

          {a.strengths.length > 0 && (
            <div>
              <p className={SECTION}>Your strengths</p>
              <ul className="list-disc space-y-1 pl-5 text-mint">{a.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}

          {a.risks.length > 0 && (
            <div className="space-y-2">
              <p className={SECTION}>Risk factors</p>
              {a.risks.map((r) => (
                <div key={r.type} className={`rounded-2xl border px-3 py-2 ${SEVERITY[r.severity]}`}>
                  <span className="font-semibold capitalize">{r.type.replace(/_/g, " ")}</span>: {r.message}
                </div>
              ))}
            </div>
          )}

          {a.gaps.length > 0 && (
            <div className="space-y-2">
              <p className={SECTION}>Skill gaps</p>
              {a.gaps.map((g) => (
                <div key={g.skill} className="rounded-2xl border border-line p-3 dark:border-line-dark">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-semibold">{g.skill}</span>
                    <span className={`text-xs font-semibold ${PRIORITY[g.priority]}`}>{g.priority} priority · {formatHours(g.estimatedHours)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {g.resources.map((r) => <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-lavender-dark hover:underline">{r.label}</a>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className={SECTION}>
              Competition: <span className="capitalize">{a.competition.level}</span> ({a.competition.score}/100)
            </p>
            <ul className="list-disc space-y-1 pl-5 text-ink-secondary dark:text-ink-secondary-dark">{a.competition.factors.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        {a.gaps.length > 0 && <button type="button" onClick={onPlan} className="btn-primary px-4 py-2 text-xs">Create learning plan</button>}
        <button type="button" onClick={onDelete} className="text-xs font-semibold text-coral hover:underline">Remove</button>
      </div>
    </div>
  );
}
