"use client";

import { useEffect, useState } from "react";
import { OpportunityService } from "@/services/OpportunityService";
import { formatHours } from "@/lib/obliqo/learning";
import type { LearningPlan } from "@/lib/obliqo/types";

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

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!plans.length) return <p className="text-gray-600">No learning plans yet. Open a job with skill gaps and choose &quot;Create learning plan&quot;.</p>;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {plans.map((plan) => {
        const done = plan.items.filter((i) => i.done).length;
        const hoursLeft = plan.items.filter((i) => !i.done).reduce((s, i) => s + i.estimatedHours, 0);
        return (
          <div key={plan.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{plan.jobTitle}</h3>
                <p className="text-sm text-gray-600">{plan.company} · {done}/{plan.items.length} skills done · {formatHours(hoursLeft)} left</p>
              </div>
              <button onClick={() => remove(plan)} className="text-sm text-red-600 hover:underline">Delete</button>
            </div>
            <div className="mt-2 h-1.5 rounded bg-gray-200"><div className="h-1.5 rounded bg-green-500" style={{ width: `${plan.items.length ? (done / plan.items.length) * 100 : 0}%` }} /></div>
            <ul className="mt-3 space-y-2">
              {plan.items.map((it, i) => (
                <li key={it.skill} className="rounded border p-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={it.done} onChange={() => toggle(plan, i)} />
                    <span className={it.done ? "text-gray-400 line-through" : "font-medium"}>{it.skill}</span>
                    <span className="text-xs text-gray-500">{it.priority} priority · {formatHours(it.estimatedHours)}</span>
                  </label>
                  <div className="ml-6 mt-1 flex flex-wrap gap-x-3 text-xs">
                    {it.resources.map((r) => <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{r.label}</a>)}
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
