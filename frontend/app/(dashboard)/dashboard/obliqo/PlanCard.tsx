"use client";

import { useState } from "react";
import { UI } from "@/lib/obliqo/ui";
import { DEFAULT_SCHEDULE, LEVEL_NAMES, baseHoursFor, buildPlan, clampSchedule, fitPlan, planAsChecklist, resolvePlan, type PlanOverride, type PlanStep, type Profile } from "@/lib/obliqo/matching";
import { coursesFor, safeUrl, searchLinks, type Course } from "@/lib/obliqo/courses";

type Update = (fn: (p: Profile) => Profile) => void;
type Filter = "all" | "free" | "paid";

const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export default function PlanCard({ skill, profile, update, onReplan }: { skill: string; profile: Profile; update: Update; onReplan: (skill: string) => void }) {
  const plan = resolvePlan(skill, profile);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [copied, setCopied] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cUrl, setCUrl] = useState("");
  const [cFree, setCFree] = useState(true);
  const [cErr, setCErr] = useState<string | null>(null);
  const saved = plan.schedule ?? DEFAULT_SCHEDULE;
  const [wk, setWk] = useState(String(saved.weeks));
  const [hpd, setHpd] = useState(String(saved.hoursPerDay));
  const [dpw, setDpw] = useState(String(saved.daysPerWeek));

  const key = (id: string) => `${skill}|${id}`;
  const done = plan.steps.filter((s) => profile.planDone[key(s.id)]).length;
  const pct = plan.steps.length ? (done / plan.steps.length) * 100 : 0;

  /* ---- all edits go through here; the first step edit copies the suggested steps into the user's own list ---- */
  const edit = (fn: (o: PlanOverride & { steps: PlanStep[] }) => PlanOverride) =>
    update((p) => {
      const cur = p.planEdits[skill] ?? { courses: [] };
      const steps = cur.steps ?? buildPlan(skill, p).steps;
      return { ...p, planEdits: { ...p.planEdits, [skill]: fn({ ...cur, steps }) } };
    });
  const editCourses = (fn: (c: Course[]) => Course[]) =>
    update((p) => {
      const cur = p.planEdits[skill] ?? { courses: [] };
      return { ...p, planEdits: { ...p.planEdits, [skill]: { ...cur, courses: fn(cur.courses ?? []) } } };
    });

  const patchStep = (id: string, patch: Partial<PlanStep>) => edit((o) => ({ ...o, steps: o.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  const moveStep = (id: string, dir: -1 | 1) =>
    edit((o) => {
      const i = o.steps.findIndex((s) => s.id === id), j = i + dir;
      if (i < 0 || j < 0 || j >= o.steps.length) return o;
      const steps = [...o.steps];
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...o, steps };
    });
  const removeStep = (id: string) => {
    edit((o) => ({ ...o, steps: o.steps.filter((s) => s.id !== id) }));
    update((p) => { const { [key(id)]: _drop, ...rest } = p.planDone; void _drop; return { ...p, planDone: rest }; });
  };
  const addStep = () => edit((o) => ({ ...o, steps: [...o.steps, { id: newId("c"), week: o.steps.length ? Math.max(...o.steps.map((s) => s.week)) : 1, title: "New step", detail: "" }] }));
  const resetPlan = () => {
    if (!window.confirm(`Reset the ${skill} plan to the suggested steps? Your edits and added courses for it will be removed.`)) return;
    update((p) => ({ ...p, planEdits: Object.fromEntries(Object.entries(p.planEdits).filter(([k]) => k !== skill)) }));
    setEditing(false);
  };
  const toggle = (id: string) => update((p) => ({ ...p, planDone: { ...p.planDone, [key(id)]: !p.planDone[key(id)] } }));

  /* ---- time-fit: weeks x days x hours available -> hour budget and week for every step ---- */
  const schedule = clampSchedule({ weeks: Number(wk), hoursPerDay: Number(hpd), daysPerWeek: Number(dpw) });
  const needed = baseHoursFor(skill, profile);
  const preview = fitPlan(plan.steps, needed, schedule);
  const applyFit = () => {
    setWk(String(schedule.weeks)); setHpd(String(schedule.hoursPerDay)); setDpw(String(schedule.daysPerWeek));
    edit((o) => ({ ...o, steps: fitPlan(o.steps, needed, schedule).steps, schedule }));
  };
  const verdictText =
    preview.verdict === "tight" ? `Tight: this usually takes about ${needed} h and you have ${preview.available} h. At ${preview.hoursPerWeek} h/week you'd need about ${preview.minWeeks} weeks to cover it fully. The plan below still fits your time, so treat the last steps as optional.`
    : preview.verdict === "roomy" ? `Roomy: you have ${preview.available} h and this usually takes about ${needed} h, so each step gets extra practice time.`
    : `Good fit: you have ${preview.available} h and this usually takes about ${needed} h.`;

  const pinned = new Set(plan.courses.map((c) => c.id));
  const catalog = coursesFor(skill).filter((c) => filter === "all" || (filter === "free") === c.free);
  const addCustom = () => {
    const url = safeUrl(cUrl);
    if (!cTitle.trim()) return setCErr("Give the course a title.");
    if (!url) return setCErr("Enter a full link starting with https://");
    editCourses((c) => [...c, { id: newId("u"), title: cTitle.trim(), provider: new URL(url).hostname.replace(/^www\./, ""), url, free: cFree, custom: true }]);
    setCTitle(""); setCUrl(""); setCErr(null);
  };

  const small = `${UI.btn} ${UI.btnGhost} !px-2 !py-1 !text-xs`;
  const cell = `${UI.input} !px-2 !py-1`;

  return (
    <div className={`${UI.card} space-y-3 p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{skill}</h3>
          <div className={`text-xs ${UI.muted}`}>
            About {plan.weeks} week{plan.weeks === 1 ? "" : "s"}{plan.shortenedBy ? ` (shorter because you know ${plan.shortenedBy})` : ""} · {done}/{plan.steps.length} done{plan.goal ? ` · goal: ${LEVEL_NAMES[plan.goal]}` : ""}{plan.edited ? " · customized" : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className={small} onClick={() => onReplan(skill)}>New roadmap</button>
          <button className={small} onClick={() => setEditing((e) => !e)}>{editing ? "Done editing" : "Edit plan"}</button>
          <button onClick={() => update((p) => ({ ...p, planSkills: p.planSkills.filter((s) => s !== skill) }))} className="text-slate-400 hover:text-rose-500" aria-label={`Remove ${skill} plan`}>✕</button>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10"><div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>

      {/* ---------------- time-fit ---------------- */}
      {editing && <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-white/10">
        <div className="text-sm font-semibold">Squeeze or stretch to a deadline</div>
        <div className="grid grid-cols-3 gap-2">
          <label className={`text-xs ${UI.muted}`}>Weeks
            <input type="number" min={1} max={52} className={`${cell} mt-0.5`} value={wk} onChange={(e) => setWk(e.target.value)} />
          </label>
          <label className={`text-xs ${UI.muted}`}>Days / week
            <input type="number" min={1} max={7} className={`${cell} mt-0.5`} value={dpw} onChange={(e) => setDpw(e.target.value)} />
          </label>
          <label className={`text-xs ${UI.muted}`}>Hours / day
            <input type="number" min={0.5} max={12} step={0.5} className={`${cell} mt-0.5`} value={hpd} onChange={(e) => setHpd(e.target.value)} />
          </label>
        </div>
        <div className={`text-xs ${preview.verdict === "tight" ? "text-amber-700 dark:text-amber-300" : UI.muted}`}>{verdictText}</div>
        <button className={`${UI.btn} ${UI.btnPrimary} !py-1 !text-xs`} onClick={applyFit}>{plan.schedule ? "Re-fit plan" : "Fit plan to my time"}</button>
      </div>}

      {/* ---------------- steps ---------------- */}
      <ul className="space-y-2">
        {plan.steps.map((st, i) => (
          <li key={st.id}>
            {editing ? (
              <div className="space-y-1 rounded-xl border border-slate-200 p-2 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <label className={`flex items-center gap-1 text-xs ${UI.muted}`}>Week
                    <input type="number" min={1} max={52} className={`${cell} !w-16`} value={st.week} onChange={(e) => patchStep(st.id, { week: Math.max(1, Math.min(52, Number(e.target.value) || 1)) })} />
                  </label>
                  <label className={`flex items-center gap-1 text-xs ${UI.muted}`}>Hours
                    <input type="number" min={0.5} max={500} step={0.5} className={`${cell} !w-16`} value={st.hours ?? ""} onChange={(e) => patchStep(st.id, { hours: Number(e.target.value) > 0 ? Number(e.target.value) : undefined })} />
                  </label>
                  <input className={cell} value={st.title} placeholder="Step title" onChange={(e) => patchStep(st.id, { title: e.target.value })} />
                </div>
                <textarea className={`${cell} min-h-[2.5rem]`} value={st.detail} placeholder="What to do in this step" onChange={(e) => patchStep(st.id, { detail: e.target.value })} />
                <textarea className={`${cell} min-h-[3.5rem]`} value={(st.points ?? []).join("\n")} placeholder="Practice points, one per line" onChange={(e) => patchStep(st.id, { points: e.target.value.split("\n") })} />
                <div className="flex gap-1">
                  <button className={small} disabled={i === 0} onClick={() => moveStep(st.id, -1)} aria-label="Move up">↑</button>
                  <button className={small} disabled={i === plan.steps.length - 1} onClick={() => moveStep(st.id, 1)} aria-label="Move down">↓</button>
                  <button className={`${small} !text-rose-600`} onClick={() => removeStep(st.id)}>Delete</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 text-sm">
                <input type="checkbox" id={`${skill}-${st.id}`} className="mt-1" checked={!!profile.planDone[key(st.id)]} onChange={() => toggle(st.id)} />
                <div className="min-w-0 space-y-1">
                  <label htmlFor={`${skill}-${st.id}`} className="cursor-pointer font-medium">{i + 1}. {st.title}</label>
                  <div className={`text-xs ${UI.muted}`}>
                    Week {st.week}{st.hours ? ` · ~${st.hours} h` : ""}{st.hours && plan.schedule ? ` · ~${Math.max(1, Math.ceil(st.hours / plan.schedule.hoursPerDay))} days` : ""}{st.phase ? ` · ${st.phase}` : ""}
                  </div>
                  {st.detail && <p className={UI.muted}>{st.detail}</p>}
                  {st.points && st.points.length > 0 && <ul className="list-disc space-y-0.5 pl-5">{st.points.map((pt, k) => <li key={k}>{pt}</li>)}</ul>}
                  {st.resource && <div className="text-xs"><span className={UI.muted}>Free resource: </span><a className="text-violet-600 underline dark:text-violet-300" href={st.resource.url} target="_blank" rel="noopener noreferrer">{st.resource.label}</a></div>}
                </div>
              </div>
            )}
          </li>
        ))}
        {plan.steps.length === 0 && <li className={`text-sm ${UI.muted}`}>No steps yet. {editing ? "Add one below." : "Use Edit plan to add steps."}</li>}
      </ul>
      {editing && (
        <div className="flex flex-wrap gap-2">
          <button className={small} onClick={addStep}>+ Add step</button>
          {plan.edited && <button className={small} onClick={resetPlan}>Reset to suggested plan</button>}
        </div>
      )}

      {/* ---------------- courses ---------------- */}
      <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-white/10">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">Courses</h4>
          <div className="flex gap-1">
            {(["all", "free", "paid"] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`${UI.chip} ${filter === f ? "border-violet-500 text-violet-600 dark:text-violet-300" : "border-slate-300 dark:border-white/15"}`}>{f === "all" ? "All" : f === "free" ? "Free" : "Paid"}</button>
            ))}
          </div>
        </div>

        {plan.courses.length > 0 && (
          <div className="space-y-1">
            <div className={`text-xs ${UI.muted}`}>In your plan</div>
            {plan.courses.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
                <a className="min-w-0 truncate text-violet-600 underline dark:text-violet-300" href={c.url} target="_blank" rel="noopener noreferrer">{c.title}</a>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`text-xs ${UI.muted}`}>{c.free ? "Free" : "Paid"}</span>
                  <button className="text-slate-400 hover:text-rose-500" aria-label={`Remove ${c.title}`} onClick={() => editCourses((cs) => cs.filter((x) => x.id !== c.id))}>✕</button>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <div className={`text-xs ${UI.muted}`}>Recommended</div>
          {catalog.length === 0 && <div className={`text-sm ${UI.muted}`}>{coursesFor(skill).length === 0 ? "No hand-picked courses for this skill yet. Try the searches below." : `No ${filter} courses listed for ${skill}.`}</div>}
          {catalog.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 p-2 text-sm dark:border-white/10">
              <div className="min-w-0">
                <a className="font-medium text-violet-600 underline dark:text-violet-300" href={c.url} target="_blank" rel="noopener noreferrer">{c.title}</a>
                <div className={`text-xs ${UI.muted}`}>{c.provider} · {c.free ? "Free" : "Paid"}{c.note ? ` · ${c.note}` : ""}</div>
              </div>
              <button className={small} disabled={pinned.has(c.id)} onClick={() => editCourses((cs) => [...cs, c])}>{pinned.has(c.id) ? "Added" : "Add"}</button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={UI.muted}>Search more:</span>
            {searchLinks(skill).filter((l) => filter === "all" || (filter === "free") === l.free).map((l) => (
              <a key={l.url} className="text-violet-600 underline dark:text-violet-300" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>
            ))}
          </div>
        </div>

        {editing && (
          <div className="space-y-1 rounded-xl border border-dashed border-slate-300 p-2 dark:border-white/20">
            <div className={`text-xs ${UI.muted}`}>Add your own course</div>
            <input className={cell} placeholder="Title" value={cTitle} onChange={(e) => setCTitle(e.target.value)} />
            <input className={cell} placeholder="https://..." value={cUrl} onChange={(e) => setCUrl(e.target.value)} />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={cFree} onChange={(e) => setCFree(e.target.checked)} /> Free</label>
              <button className={small} onClick={addCustom}>Add course</button>
            </div>
            {cErr && <div className="text-xs text-rose-600">{cErr}</div>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button className={`${UI.btn} ${UI.btnGhost} !text-xs`} onClick={async () => { try { await navigator.clipboard.writeText(planAsChecklist(plan)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ } }}>
          {copied ? "Copied" : "Copy as checklist"}
        </button>
        <button className={`${UI.btn} ${UI.btnGhost} !text-xs`} onClick={() => update((p) => ({ ...p, skills: p.skills.some((s) => s.name === skill) ? p.skills : [...p.skills, { name: skill, level: 1 }], planSkills: p.planSkills.filter((s) => s !== skill) }))}>I finished this: add as Beginner</button>
      </div>
    </div>
  );
}
