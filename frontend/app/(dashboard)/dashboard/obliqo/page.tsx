"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  AGE_AFFECTS_DECISION, DEFAULT_FILTERS, EMPTY_PROFILE, LEVEL_NAMES, ROLES,
  applyFilters, buildIndex, fmtPosted, normalizeSkill, scoreAll, skillGaps,
  type Decision, type Filters, type Index, type Level, type Profile, type Scored,
} from "@/lib/obliqo/matching";
import {
  loadDataset, loadPrefs, saveProfile, savePrefs, setJobStatus, subscribeJobStatus, subscribeProfile, type JobStatus, type Sort, type Tab,
} from "@/lib/obliqo/store";
import { UI } from "@/lib/obliqo/ui";
import PlanCard from "./PlanCard";
import PlanWizard from "./PlanWizard";
import ProfileTab from "./ProfileTab";
import type { Roadmap } from "@/lib/obliqo/roadmaps";

/* Look & feel lives in lib/obliqo/ui.ts. */
const DECISION_STYLE: Record<Decision, { text: string; bg: string; ring: string }> = {
  Apply: { text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-500/15", ring: "#10b981" },
  Wait: { text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-500/15", ring: "#f59e0b" },
  Skip: { text: "text-slate-600 dark:text-slate-300", bg: "bg-slate-100 dark:bg-white/10", ring: "#94a3b8" },
  Avoid: { text: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-500/15", ring: "#f43f5e" },
};
const DECISIONS: Decision[] = ["Apply", "Wait", "Skip", "Avoid"];
const PAGE_SIZE = 40;


function useUid() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(getAuth(), (u) => setUid(u ? u.uid : null)), []);
  return uid;
}

/* ================================ page ================================ */

export default function ObliqoPage() {
  const uid = useUid();
  const [idx, setIdx] = useState<Index | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statuses, setStatuses] = useState<Record<string, JobStatus>>({});
  const [tab, setTab] = useState<Tab>("jobs");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<Sort>("match");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);
  const [fsErr, setFsErr] = useState<string | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [wizardSkill, setWizardSkill] = useState<string | null>(null);

  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    loadDataset().then((d) => alive && setIdx(buildIndex(d))).catch((e) => alive && setLoadErr(String(e.message ?? e)));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!uid) return;
    const u1 = subscribeProfile(uid, (p) => { if (!dirty.current) setProfile(p); setProfileLoaded(true); }, (e) => { console.error("obliqo profile", e); setFsErr(e.message); });
    const u2 = subscribeJobStatus(uid, setStatuses, (e) => { console.error("obliqo jobs", e); setFsErr(e.message); });
    return () => { u1(); u2(); };
  }, [uid]);

  // Restore filters / sort / tab once, then save changes (debounced) to users/{uid}/obliqo/prefs.
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    loadPrefs(uid)
      .then((p) => { if (!alive) return; if (p?.filters) setFilters(p.filters); if (p?.sort) setSort(p.sort); if (p?.tab) setTab(p.tab); })
      .catch((e) => console.error("obliqo prefs", e))
      .finally(() => alive && setPrefsLoaded(true));
    return () => { alive = false; };
  }, [uid]);
  useEffect(() => {
    if (!uid || !prefsLoaded) return;
    const t = setTimeout(() => { savePrefs(uid, { filters, sort, tab }).catch((e) => console.error("obliqo prefs save", e)); }, 800);
    return () => clearTimeout(t);
  }, [uid, prefsLoaded, filters, sort, tab]);

  const update = useCallback((fn: (p: Profile) => Profile) => {
    setProfile((prev) => {
      const next = fn(prev);
      dirty.current = true;
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        if (!uid) return;
        try { await saveProfile(uid, next); dirty.current = false; setSaveState("saved"); }
        catch (e) { console.error("obliqo save", e); setSaveState("error"); }
      }, 600);
      return next;
    });
  }, [uid]);

  const scored = useMemo(() => (idx ? scoreAll(idx, profile) : []), [idx, profile]);
  const gaps = useMemo(() => (idx ? skillGaps(idx, profile, scored) : []), [idx, profile, scored]);

  const range = useMemo(() => {
    if (!idx) return "";
    const ts = idx.jobs.map((j) => j.postedAt).filter((t): t is number => t != null);
    if (!ts.length) return "";
    const a = fmtPosted(Math.min(...ts)), b = fmtPosted(Math.max(...ts));
    return a === b ? a : `${a} to ${b}`;
  }, [idx]);

  const counts = useMemo(() => {
    const base = applyFilters(scored, filters, true);
    const c: Record<Decision, number> = { Apply: 0, Wait: 0, Skip: 0, Avoid: 0 };
    base.forEach((s) => { c[s.decision]++; });
    return { c, total: base.length };
  }, [scored, filters]);

  const list = useMemo(() => {
    const l = applyFilters(scored, filters);
    const by: Record<Sort, (a: Scored, b: Scored) => number> = {
      match: (a, b) => b.score - a.score,
      stipend: (a, b) => (b.job.stipendMonthly ?? -1) - (a.job.stipendMonthly ?? -1) || b.score - a.score,
      newest: (a, b) => (b.job.postedAt ?? 0) - (a.job.postedAt ?? 0) || b.score - a.score,
    };
    return [...l].sort(by[sort]);
  }, [scored, filters, sort]);

  useEffect(() => { setShown(PAGE_SIZE); }, [filters, sort]);

  const selected = useMemo(() => scored.find((s) => s.job.id === selectedId) ?? null, [scored, selectedId]);

  const setStatus = (id: string, st: JobStatus | null) => {
    if (!uid) return;
    setJobStatus(uid, id, st).catch((e) => { console.error("obliqo status", e); setFsErr(e.message); });
  };
  // "Plan" opens a short wizard (daily hours, then target level) that builds the roadmap.
  const addPlan = (skill: string) => setWizardSkill(skill);
  const createPlan = (skill: string, r: Roadmap) => {
    update((p) => ({
      ...p,
      planSkills: p.planSkills.includes(skill) ? p.planSkills : [...p.planSkills, skill],
      planEdits: { ...p.planEdits, [skill]: { courses: p.planEdits[skill]?.courses ?? [], steps: r.steps, schedule: r.schedule, goal: r.goal } },
      planDone: Object.fromEntries(Object.entries(p.planDone).filter(([k]) => !k.startsWith(`${skill}|`))), // new steps start unchecked
    }));
    setWizardSkill(null);
    setTab("plans");
  };

  if (uid === null) return <div className={`${UI.card} p-6 text-sm`}>Please sign in to use Obliqo.</div>;
  if (loadErr) return <div className={`${UI.card} p-6 text-sm text-rose-600`}>{loadErr}. Make sure <code>public/obliqo/jobs.json</code> exists.</div>;
  if (!idx || uid === undefined) return <div className={`${UI.card} p-6 text-sm ${UI.muted}`}>Loading listings...</div>;

  const hasSkills = profile.skills.length > 0;
  const tabs: [Tab, string][] = [["jobs", "Jobs"], ["profile", "Profile"], ["skills", "My Skills"], ["plans", `Learning Plans${profile.planSkills.length ? ` (${profile.planSkills.length})` : ""}`], ["saved", `Saved${Object.keys(statuses).length ? ` (${Object.keys(statuses).length})` : ""}`]];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Obliqo</h1>
          <p className={`text-sm ${UI.muted}`}>
            {hasSkills
              ? `Ranked for your ${profile.skills.length} skill${profile.skills.length === 1 ? "" : "s"}${profile.targetRole ? `, target: ${profile.targetRole}` : ""}`
              : "Add your skills to rank the listings for you."}
          </p>
        </div>
        <div className={`text-xs ${UI.muted}`}>
          {saveState === "saving" && "Saving..."}{saveState === "saved" && "Saved"}{saveState === "error" && <span className="text-rose-600">Couldn&apos;t save. Check the console.</span>}
        </div>
      </div>

      {fsErr && <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">Firestore error: {fsErr}. Check that <code>firestore.rules</code> is published.</div>}
      {uid && profileLoaded === false && !fsErr && <div className={`text-xs ${UI.muted}`}>Loading your profile...</div>}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/10">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? "border-violet-500 text-violet-600 dark:text-violet-300" : `border-transparent ${UI.muted} hover:text-slate-900 dark:hover:text-white`}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "jobs" && (
        <>
          <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
            These {idx.jobs.length} listings were collected in {range || "2024"}. Confirm a listing is still open before you apply.{!AGE_AFFECTS_DECISION && " Age does not change the Apply / Wait / Skip label."}
          </div>
          {!hasSkills && (
            <div className={`${UI.card} flex flex-wrap items-center justify-between gap-2 p-3 text-sm`}>
              <span>Scores are 0% until you add skills.</span>
              <button className={`${UI.btn} ${UI.btnPrimary}`} onClick={() => setTab("skills")}>Add skills</button>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)_380px]">
            <FilterPanel filters={filters} setFilters={setFilters} counts={counts} />
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={`text-sm ${UI.muted}`}>Showing {Math.min(shown, list.length)} of {counts.total} listing{counts.total === 1 ? "" : "s"}{filters.decision ? ` (${filters.decision})` : ""}</div>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${UI.input} !w-auto`}>
                  <option value="match">Best match</option><option value="stipend">Highest stipend</option><option value="newest">Newest</option>
                </select>
              </div>
              <div className="space-y-2">
                {list.slice(0, shown).map((s) => (
                  <JobCard key={s.job.id} s={s} active={s.job.id === selectedId} status={statuses[s.job.id]} onOpen={() => setSelectedId(s.job.id)} />
                ))}
                {list.length === 0 && <div className={`${UI.card} p-6 text-center text-sm ${UI.muted}`}>No listings match these filters.</div>}
                {shown < list.length && <button className={`${UI.btn} ${UI.btnGhost} w-full`} onClick={() => setShown((n) => n + PAGE_SIZE)}>Show more</button>}
              </div>
            </div>
            <div className={selected ? "" : "hidden lg:block"}>
              {selected
                ? <JobDetail key={selected.job.id} s={selected} status={statuses[selected.job.id]} onClose={() => setSelectedId(null)} onStatus={(st) => setStatus(selected.job.id, st)} onPlan={(sk) => addPlan(sk)} />
                : <div className={`${UI.card} sticky top-4 p-6 text-center text-sm ${UI.muted}`}>Select a listing to see why it scored the way it did.</div>}
            </div>
          </div>
        </>
      )}

      {tab === "profile" && uid && <ProfileTab uid={uid} idx={idx} profile={profile} update={update} />}
      {tab === "skills" && <SkillsTab idx={idx} profile={profile} update={update} gaps={gaps} addPlan={addPlan} />}
      {tab === "plans" && <PlansTab profile={profile} update={update} gaps={gaps} addPlan={addPlan} />}
      {tab === "saved" && (
        <SavedTab scored={scored} statuses={statuses} onOpen={(id) => { setSelectedId(id); setTab("jobs"); }} onStatus={setStatus} />
      )}
      {wizardSkill && (() => {
        const e = profile.planEdits[wizardSkill];
        return <PlanWizard key={wizardSkill} skill={wizardSkill} onClose={() => setWizardSkill(null)} onCreate={(r) => createPlan(wizardSkill, r)}
          initial={e?.schedule && e.goal ? { hoursPerDay: e.schedule.hoursPerDay, daysPerWeek: e.schedule.daysPerWeek, goal: e.goal } : undefined} />;
      })()}
    </div>
  );
}

/* ============================== pieces =============================== */

function Ring({ value, color, size = 52, label }: { value: number; color: string; size?: number; label?: string }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={label ?? `${value}% match`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{value}%</span>
    </div>
  );
}

function Badge({ d }: { d: Decision }) {
  const st = DECISION_STYLE[d];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.bg} ${st.text}`}>{d}</span>;
}

function FilterPanel({ filters, setFilters, counts }: { filters: Filters; setFilters: (f: Filters) => void; counts: { c: Record<Decision, number>; total: number } }) {
  const set = (p: Partial<Filters>) => setFilters({ ...filters, ...p });
  const stip = [0, 5000, 10000, 15000, 20000];
  return (
    <aside className={`${UI.card} h-fit space-y-4 p-3 lg:sticky lg:top-4`}>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Decision</div>
        <div className="grid grid-cols-2 gap-2">
          {DECISIONS.map((d) => {
            const on = filters.decision === d, st = DECISION_STYLE[d];
            return (
              <button key={d} onClick={() => set({ decision: on ? null : d })}
                className={`rounded-xl border p-2 text-left ${on ? "border-violet-500 ring-1 ring-violet-500" : "border-slate-200 dark:border-white/10"}`}>
                <div className={`text-lg font-semibold leading-none ${st.text}`}>{counts.c[d]}</div>
                <div className={`mt-1 text-xs ${UI.muted}`}>{d}</div>
              </button>
            );
          })}
        </div>
      </div>
      <input className={UI.input} placeholder="Search title, company, skill" value={filters.query} onChange={(e) => set({ query: e.target.value })} />
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</div>
        <select className={UI.input} value={filters.role ?? ""} onChange={(e) => set({ role: e.target.value || null })}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={filters.remote} onChange={(e) => set({ remote: e.target.checked })} /> Remote only</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={filters.hideMismatched} onChange={(e) => set({ hideMismatched: e.target.checked })} /> Hide mislabeled listings</label>
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Hours</div>
        <select className={UI.input} value={filters.partTime} onChange={(e) => set({ partTime: e.target.value as Filters["partTime"] })}>
          <option value="any">Full or part time</option><option value="no">Full time only</option><option value="yes">Part time only</option>
        </select>
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Min stipend / month</div>
        <select className={UI.input} value={filters.minStipend} onChange={(e) => set({ minStipend: Number(e.target.value) })}>
          {stip.map((v) => <option key={v} value={v}>{v === 0 ? "Any" : `₹${v.toLocaleString("en-IN")}+`}</option>)}
        </select>
      </div>
      <button className={`${UI.btn} ${UI.btnGhost} w-full`} onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
    </aside>
  );
}

function JobCard({ s, active, status, onOpen }: { s: Scored; active: boolean; status?: JobStatus; onOpen: () => void }) {
  const j = s.job, st = DECISION_STYLE[s.decision];
  const have = s.have.map((m) => m.name), partial = s.related.map((m) => m.name), miss = s.missing.map((m) => m.name);
  return (
    <button onClick={onOpen} className={`${UI.card} flex w-full gap-3 p-3 text-left transition-colors hover:border-violet-400 ${active ? "!border-violet-500 ring-1 ring-violet-500" : ""}`}>
      <Ring value={s.score} color={st.ring} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{j.title}</span><Badge d={s.decision} />
          {status && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">{status === "applied" ? "Applied" : "Saved"}</span>}
          {j.titleMismatch && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Check listing</span>}
        </div>
        <div className={`text-xs ${UI.muted}`}>{j.company} · {j.location}{j.partTime ? " · Part time" : ""} · {j.stipendText.replace(/\s+/g, " ")}</div>
        <div className="flex flex-wrap gap-1">
          {have.slice(0, 6).map((n) => <span key={n} className={`${UI.chip} border-emerald-300 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-300`}>✓ {n}</span>)}
          {partial.slice(0, 3).map((n) => <span key={n} className={`${UI.chip} border-sky-300 text-sky-700 dark:border-sky-500/40 dark:text-sky-300`}>~ {n}</span>)}
          {miss.slice(0, 4).map((n) => <span key={n} className={`${UI.chip} border-slate-300 text-slate-500 dark:border-white/15`}>+ {n}</span>)}
          {have.length > 6 || miss.length > 4 ? <span className={`text-xs ${UI.muted}`}>+{Math.max(0, have.length - 6) + Math.max(0, miss.length - 4)} more</span> : null}
        </div>
      </div>
    </button>
  );
}

const CHECK_STYLE = {
  ok: ["✓", "text-emerald-600 dark:text-emerald-400"], info: ["i", "text-sky-600 dark:text-sky-400"],
  warn: ["!", "text-amber-600 dark:text-amber-400"], bad: ["✕", "text-rose-600 dark:text-rose-400"],
} as const;

function JobDetail({ s, status, onClose, onStatus, onPlan }: { s: Scored; status?: JobStatus; onClose: () => void; onStatus: (s: JobStatus | null) => void; onPlan: (skill: string) => void }) {
  const [more, setMore] = useState(false);
  const j = s.job, st = DECISION_STYLE[s.decision];
  const desc = j.description;
  const long = desc.length > 420;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-4 dark:bg-slate-900 lg:sticky lg:top-4 lg:z-auto lg:max-h-[calc(100vh-2rem)] lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white/80 lg:dark:border-white/10 lg:dark:bg-white/5">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{j.title}</h2>
            <div className={`text-sm ${UI.muted}`}>{j.company} · {j.location}{j.partTime ? " · Part time" : ""}</div>
            <div className="text-sm">{j.stipendText.replace(/\s+/g, " ")}</div>
          </div>
          <button onClick={onClose} className={`${UI.btn} ${UI.btnGhost} lg:hidden`}>Close</button>
        </div>

        <div className="flex items-center gap-3">
          <Ring value={s.score} color={st.ring} size={72} />
          <div>
            <div className="flex items-center gap-2"><Badge d={s.decision} /><span className="text-sm font-medium">{s.score}% match</span></div>
            <p className={`mt-1 text-sm ${UI.muted}`}>{s.summary}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Bar label="Skills" value={s.skillScore} />
          {s.roleScore != null && <Bar label="Role fit" value={s.roleScore} />}
          <p className={`text-xs ${UI.muted}`}>{s.roleScore != null ? "Score = 70% skills + 30% role fit. " : "Score = skills only (pick a target role in My Skills to add role fit). "}Skill levels count: Beginner 55%, Intermediate 80%, Advanced 100%. Related skills count 40%.</p>
        </div>

        <Section title="Skills you have">
          {s.have.length === 0 && s.related.length === 0 && <span className={`text-sm ${UI.muted}`}>None of the listed skills yet.</span>}
          <div className="flex flex-wrap gap-1.5">
            {s.have.map((m) => <span key={m.name} className={`${UI.chip} border-emerald-300 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-300`}>✓ {m.name} · {LEVEL_NAMES[m.level as Level]}</span>)}
            {s.related.map((m) => <span key={m.name} title={`Partial credit through ${m.via}`} className={`${UI.chip} border-sky-300 text-sky-700 dark:border-sky-500/40 dark:text-sky-300`}>~ {m.name} (via {m.via})</span>)}
          </div>
        </Section>

        {s.missing.length > 0 && (
          <Section title="Skills to learn">
            <div className="flex flex-wrap gap-1.5">
              {s.missing.map((m) => (
                <button key={m.name} onClick={() => onPlan(m.name)} title="Add a learning plan" className={`${UI.chip} border-slate-300 hover:border-violet-400 hover:text-violet-600 dark:border-white/15`}>+ {m.name}</button>
              ))}
            </div>
            <p className={`mt-1 text-xs ${UI.muted}`}>Tap a skill to add a week-by-week plan.</p>
          </Section>
        )}

        <Section title="Listing check">
          <ul className="space-y-1.5">
            {s.checks.map((c) => (
              <li key={c.id} className="flex gap-2 text-sm">
                <span className={`mt-0.5 w-4 shrink-0 text-center font-bold ${CHECK_STYLE[c.level][1]}`}>{CHECK_STYLE[c.level][0]}</span><span>{c.text}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="About the role">
          <p className={`whitespace-pre-line text-sm ${UI.muted}`}>{more || !long ? desc : desc.slice(0, 420) + "..."}</p>
          {long && <button className="mt-1 text-sm text-violet-600 dark:text-violet-300" onClick={() => setMore(!more)}>{more ? "Show less" : "Show more"}</button>}
          <p className={`mt-2 text-xs ${UI.muted}`}>Posted {fmtPosted(j.postedAt)}</p>
        </Section>

        <div className="flex flex-wrap gap-2">
          <a href={j.url} target="_blank" rel="noopener noreferrer" className={`${UI.btn} ${UI.btnPrimary}`}>Open original listing</a>
          <button className={`${UI.btn} ${UI.btnGhost}`} onClick={() => onStatus(status === "saved" ? null : "saved")}>{status === "saved" ? "Unsave" : "Save"}</button>
          <button className={`${UI.btn} ${UI.btnGhost}`} onClick={() => onStatus(status === "applied" ? null : "applied")}>{status === "applied" ? "Mark not applied" : "Mark applied"}</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>{children}</div>;
}
function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs"><span>{label}</span><span>{value}%</span></div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10"><div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

/* ============================= My Skills ============================== */

function SkillsTab({ idx, profile, update, gaps, addPlan }: {
  idx: Index; profile: Profile; update: (fn: (p: Profile) => Profile) => void;
  gaps: { skill: string; listings: number; unlocks: number }[]; addPlan: (s: string) => void;
}) {
  const [q, setQ] = useState("");
  const have = new Set(profile.skills.map((s) => s.name));
  const options = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [] as string[];
    const names = new Set<string>();
    idx.data.skills.forEach((s) => { if (s.kind === "technical" && s.name.toLowerCase().includes(t)) names.add(s.name); });
    Object.entries(idx.data.aliases).forEach(([k, v]) => { if (k.includes(t)) v.forEach((n) => names.add(n)); });
    return Array.from(names).filter((n) => !have.has(n)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, idx, profile.skills]);

  const add = (text: string, level: Level = 2) => {
    const names = normalizeSkill(idx, text);
    update((p) => {
      const cur = new Set(p.skills.map((s) => s.name));
      const add = names.filter((n) => !cur.has(n)).map((name) => ({ name, level }));
      return add.length ? { ...p, skills: [...p.skills, ...add] } : p;
    });
    setQ("");
  };
  const cycle = (name: string) => update((p) => ({ ...p, skills: p.skills.map((s) => (s.name === name ? { ...s, level: ((s.level % 3) + 1) as Level } : s)) }));
  const remove = (name: string) => update((p) => ({ ...p, skills: p.skills.filter((s) => s.name !== name) }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <div className={`${UI.card} space-y-3 p-4`}>
          <h2 className="font-semibold">Target role</h2>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button key={r} onClick={() => update((p) => ({ ...p, targetRole: p.targetRole === r ? null : r }))}
                className={`${UI.chip} ${profile.targetRole === r ? "border-violet-500 bg-violet-500 text-white" : "border-slate-300 dark:border-white/15"}`}>{r}</button>
            ))}
          </div>
          <p className={`text-xs ${UI.muted}`}>Adds a role-fit factor (30% of the score). Leave it empty to rank on skills alone.</p>
        </div>

        <div className={`${UI.card} space-y-3 p-4`}>
          <h2 className="font-semibold">Your skills</h2>
          <div className="relative">
            <input className={UI.input} placeholder="Add a skill, e.g. React" value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && q.trim()) add(options[0] ?? q); }} />
            {options.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-800">
                {options.map((o) => <li key={o}><button className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => add(o)}>{o}</button></li>)}
              </ul>
            )}
          </div>
          {profile.skills.length === 0 && <p className={`text-sm ${UI.muted}`}>No skills yet. Add a few and every listing is re-scored instantly.</p>}
          <ul className="space-y-2">
            {profile.skills.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="flex items-center gap-2">
                  <button onClick={() => cycle(s.name)} title="Tap to change level" className={`${UI.chip} border-violet-300 text-violet-700 dark:border-violet-500/40 dark:text-violet-300`}>{LEVEL_NAMES[s.level]}</button>
                  <button onClick={() => remove(s.name)} aria-label={`Remove ${s.name}`} className="text-slate-400 hover:text-rose-500">✕</button>
                </span>
              </li>
            ))}
          </ul>
          <p className={`text-xs ${UI.muted}`}>Tap the level to cycle Beginner, Intermediate, Advanced. It changes your scores. Changes save automatically.</p>
        </div>
      </div>

      <div className={`${UI.card} h-fit space-y-3 p-4`}>
        <h2 className="font-semibold">Skills you&apos;re lacking</h2>
        <p className={`text-xs ${UI.muted}`}>Across listings near your target role. &quot;Unlocks&quot; counts listings where this is one of at most two skills you&apos;re missing.</p>
        {gaps.length === 0 && <p className={`text-sm ${UI.muted}`}>{profile.skills.length ? "No gaps found." : "Add skills first."}</p>}
        <ul className="space-y-2">
          {gaps.map((g) => (
            <li key={g.skill} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10">
              <div>
                <div className="text-sm font-medium">{g.skill}</div>
                <div className={`text-xs ${UI.muted}`}>in {g.listings} listings · unlocks {g.unlocks}</div>
              </div>
              <div className="flex gap-1.5">
                <button className={`${UI.btn} ${UI.btnGhost} !px-2 !py-1 !text-xs`} onClick={() => add(g.skill, 1)}>I know it</button>
                <button className={`${UI.btn} ${UI.btnPrimary} !px-2 !py-1 !text-xs`} onClick={() => addPlan(g.skill)}>Plan it</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ============================ Learning Plans ========================== */

function PlansTab({ profile, update, gaps, addPlan }: {
  profile: Profile; update: (fn: (p: Profile) => Profile) => void;
  gaps: { skill: string; listings: number; unlocks: number }[]; addPlan: (s: string) => void;
}) {
  const suggestions = gaps.filter((g) => !profile.planSkills.includes(g.skill)).slice(0, 6);

  if (profile.planSkills.length === 0) {
    return (
      <div className={`${UI.card} space-y-3 p-6`}>
        <h2 className="font-semibold">No learning plans yet</h2>
        <p className={`text-sm ${UI.muted}`}>Add one from a listing&apos;s &quot;Skills to learn&quot; or pick a suggestion.</p>
        <div className="flex flex-wrap gap-2">{suggestions.map((g) => <button key={g.skill} className={`${UI.chip} border-slate-300 hover:border-violet-400 dark:border-white/15`} onClick={() => addPlan(g.skill)}>+ {g.skill} (unlocks {g.unlocks})</button>)}</div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {profile.planSkills.map((skill) => <PlanCard key={skill} skill={skill} profile={profile} update={update} onReplan={addPlan} />)}
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={UI.muted}>Suggested:</span>
          {suggestions.map((g) => <button key={g.skill} className={`${UI.chip} border-slate-300 hover:border-violet-400 dark:border-white/15`} onClick={() => addPlan(g.skill)}>+ {g.skill}</button>)}
        </div>
      )}
    </div>
  );
}

/* ================================ Saved =============================== */

function SavedTab({ scored, statuses, onOpen, onStatus }: { scored: Scored[]; statuses: Record<string, JobStatus>; onOpen: (id: string) => void; onStatus: (id: string, s: JobStatus | null) => void }) {
  const rows = scored.filter((s) => statuses[s.job.id]).sort((a, b) => b.score - a.score);
  if (rows.length === 0) return <div className={`${UI.card} p-6 text-sm ${UI.muted}`}>Nothing saved yet. Open a listing and press Save or Mark applied.</div>;
  return (
    <div className="space-y-2">
      {rows.map((s) => (
        <div key={s.job.id} className={`${UI.card} flex flex-wrap items-center justify-between gap-2 p-3`}>
          <button className="min-w-0 flex-1 text-left" onClick={() => onOpen(s.job.id)}>
            <div className="flex items-center gap-2"><span className="font-medium">{s.job.title}</span><Badge d={s.decision} /><span className="text-xs text-violet-600 dark:text-violet-300">{statuses[s.job.id] === "applied" ? "Applied" : "Saved"}</span></div>
            <div className={`text-xs ${UI.muted}`}>{s.job.company} · {s.score}% match</div>
          </button>
          <div className="flex gap-2">
            {statuses[s.job.id] === "saved" && <button className={`${UI.btn} ${UI.btnGhost} !text-xs`} onClick={() => onStatus(s.job.id, "applied")}>Mark applied</button>}
            <button className={`${UI.btn} ${UI.btnGhost} !text-xs`} onClick={() => onStatus(s.job.id, null)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}
