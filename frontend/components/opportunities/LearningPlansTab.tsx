"use client";

import { useEffect, useState } from "react";
import { OpportunityService } from "@/services/OpportunityService";
import { formatHours } from "@/lib/obliqo/learning";
import type { LearningPlan } from "@/lib/obliqo/types";
import { H4, MUTED } from "./styles";

export default function LearningPlansTab({ uid }: { uid: string }) {
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    OpportunityService.listPlans(uid).then(setPlans).catch(() => setError("Couldn't load learning plans.")).finally(() => setLoading(false));
  }, [uid]);

  async function toggle(plan: LearningPlan, index: number) {
    const items = plan.items.map((it, i) => (i === index ? { ...it, done: !it.done } : it));
    setPlans((cur) => cur.map((p) => (p.id === plan.id ? { ...p, items } : p)));
    try { await OpportunityService.setPlanItems(plan.id!, items); }
    catch {
      setError("Couldn't save that change.");
      setPlans((cur) => cur.map((p) => (p.id === plan.id ? plan : p)));
    }
  }

  async function remove(plan: LearningPlan) {
    try {
      await OpportunityService.deletePlan(plan.id!);
      setPlans((cur) => cur.filter((p) => p.id !== plan.id));
    } catch { setError("Couldn't delete that plan."); }
  }

  if (loading) return <p className={MUTED}>Loading…</p>;
  if (!plans.length) {
    return (
      <div className="card p-6">
        <p className={MUTED}>No learning plans yet. Open a job with skill gaps and choose &quot;Create learning plan&quot;.</p>
        {error && <p className="mt-3 text-sm text-coral">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-coral">{error}</p>}
      {plans.map((plan) => {
        const done = plan.items.filter((i) => i.done).length;
        const hoursLeft = plan.items.filter((i) => !i.done).reduce((s, i) => s + i.estimatedHours, 0);
        return (
          <div key={plan.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className={H4}>{plan.jobTitle}</h3>
                <p className="mt-1 text-xs text-ink-secondary dark:text-ink-secondary-dark">
                  {plan.company} · {done}/{plan.items.length} skills done · {formatHours(hoursLeft)} left
                </p>
              </div>
              <button type="button" onClick={() => remove(plan)} className="text-xs font-semibold text-coral hover:underline">Delete</button>
            </div>
            <div className="mt-3 h-2 rounded-full bg-surface-alt dark:bg-surface-alt-dark">
              <div className="h-2 rounded-full bg-brand-gradient" style={{ width: `${plan.items.length ? (done / plan.items.length) * 100 : 0}%` }} />
            </div>
            <ul className="mt-4 space-y-3">
              {plan.items.map((it, i) => (
                <li key={it.skill} className="rounded-2xl border border-line p-3 text-sm dark:border-line-dark">
                  <label className="flex flex-wrap items-center gap-2">
                    <input type="checkbox" name={`done-${plan.id}-${i}`} checked={it.done} onChange={() => toggle(plan, i)} />
                    <span className={it.done ? "text-ink-muted line-through dark:text-ink-muted-dark" : "font-semibold"}>{it.skill}</span>
                    <span className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{it.priority} priority · {formatHours(it.estimatedHours)}</span>
                  </label>
                  <div className="ml-6 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {it.resources.map((r) => <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-lavender-dark hover:underline">{r.label}</a>)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
