"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { OpportunityService } from "@/services/OpportunityService";
import { cosine, embedTexts, semanticScore } from "@/lib/obliqo/embeddings";
import { analyzeJob } from "@/lib/obliqo/scoring";
import { parseList } from "@/lib/obliqo/skills";
import type { Decision, ExperienceLevel, Job, JobAnalysis, Popularity, UserProfile, WorkMode } from "@/lib/obliqo/types";
import JobCard from "./JobCard";
import { FIELD, LABEL, MUTED, chip } from "./styles";

const MAX_JOBS = 40;
const profileText = (p: UserProfile) => [p.headline, p.summary, p.targetRoles.join(" "), p.goals, p.skills.join(" ")].join("\n");
const jobText = (j: Job) => [j.title, j.description, j.requiredSkills.join(" ")].join("\n");

export default function JobsTab({ user, profile, onEditProfile, onPlanCreated }: {
  user: User; profile: UserProfile | null; onEditProfile: () => void; onPlanCreated: () => void;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Record<string, JobAnalysis>>({});
  const [source, setSource] = useState<"api" | "local" | null>(null);
  const [filter, setFilter] = useState<Decision | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    OpportunityService.listJobs(user.uid).then(setJobs).catch(() => setError("Couldn't load your jobs.")).finally(() => setLoading(false));
  }, [user.uid]);

  useEffect(() => {
    if (!profile || !jobs.length) { setAnalyses({}); return; }
    let cancelled = false;
    const batch = jobs.slice(0, MAX_JOBS);
    embedTexts([profileText(profile), ...batch.map(jobText)], () => user.getIdToken()).then(({ vectors, source }) => {
      if (cancelled) return;
      const out: Record<string, JobAnalysis> = {};
      batch.forEach((j, i) => {
        out[j.id!] = analyzeJob(profile, j, semanticScore(cosine(vectors[0], vectors[i + 1]), source));
      });
      setAnalyses(out);
      setSource(source);
    });
    return () => { cancelled = true; };
  }, [profile, jobs, user]);

  const ranked = useMemo(
    () => jobs.filter((j) => analyses[j.id!] && (filter === "all" || analyses[j.id!].decision === filter))
      .sort((a, b) => analyses[b.id!].score - analyses[a.id!].score),
    [jobs, analyses, filter]
  );

  async function remove(job: Job) {
    try {
      await OpportunityService.deleteJob(job.id!);
      setJobs((cur) => cur.filter((j) => j.id !== job.id));
    } catch { setError("Couldn't remove that job."); }
  }

  async function plan(job: Job) {
    try {
      await OpportunityService.createPlan(user.uid, job, analyses[job.id!].gaps);
      onPlanCreated();
    } catch { setError("Couldn't create the learning plan."); }
  }

  if (!profile) {
    return (
      <div className="card p-8 text-center">
        <p className={`mb-4 ${MUTED}`}>Set up your profile first so jobs can be matched to you.</p>
        <button onClick={onEditProfile} className="btn-primary px-5 py-2.5 text-sm">Create profile</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "apply", "wait", "skip", "avoid"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f} className={chip(filter === f)}>{f}</button>
          ))}
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2 text-sm">{showForm ? "Close" : "+ Add job"}</button>
      </div>

      {source === "local" && (
        <p className="rounded-2xl border border-pastel-orange/30 bg-pastel-orange/10 p-3 text-xs text-pastel-orange">
          Using built-in keyword-based similarity. Configure EMBEDDINGS_API_KEY on the server to enable true semantic embeddings.
        </p>
      )}
      {error && <p className="text-sm text-coral">{error}</p>}

      {showForm && <AddJobForm uid={user.uid} onAdded={(j) => { setJobs((cur) => [j, ...cur]); setShowForm(false); }} onError={setError} />}

      {loading ? <p className={MUTED}>Loading jobs…</p> : !jobs.length ? (
        <div className="card p-6"><p className={MUTED}>No jobs yet. Add a job posting to see your fit score and recommendation.</p></div>
      ) : (
        <div className="space-y-4">
          {ranked.map((j) => <JobCard key={j.id} job={j} analysis={analyses[j.id!]} onDelete={() => remove(j)} onPlan={() => plan(j)} />)}
          {jobs.length > MAX_JOBS && <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Only your {MAX_JOBS} newest jobs are analyzed.</p>}
        </div>
      )}
    </div>
  );
}

function AddJobForm({ uid, onAdded, onError }: { uid: string; onAdded: (j: Job) => void; onError: (m: string) => void }) {
  const [f, setF] = useState({
    title: "", company: "", location: "", mode: "remote" as WorkMode, level: "mid" as ExperienceLevel,
    description: "", skills: "", posted: new Date().toISOString().slice(0, 10),
    popularity: "medium" as Popularity, applicants: 0, url: "",
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((cur) => ({ ...cur, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.title.trim() || !f.description.trim()) return onError("A title and description are required.");
    setSaving(true);
    onError("");
    const job: Omit<Job, "id"> = {
      userId: uid, title: f.title.trim(), company: f.company.trim(), location: f.location.trim(),
      mode: f.mode, level: f.level, description: f.description.trim(), requiredSkills: parseList(f.skills),
      postedAt: new Date(f.posted).getTime() || Date.now(), companyPopularity: f.popularity,
      applicantsEstimate: Number(f.applicants) || 0, url: f.url.trim(), createdAt: Date.now(),
    };
    try {
      const id = await OpportunityService.addJob(job);
      onAdded({ ...job, id });
    } catch { onError("Couldn't save the job."); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="job-title" className={FIELD} placeholder="Job title *" value={f.title} onChange={(e) => set("title", e.target.value)} />
        <input name="job-company" className={FIELD} placeholder="Company" value={f.company} onChange={(e) => set("company", e.target.value)} />
        <input name="job-location" className={FIELD} placeholder="Location" value={f.location} onChange={(e) => set("location", e.target.value)} />
        <input name="job-url" className={FIELD} placeholder="Job link (optional)" value={f.url} onChange={(e) => set("url", e.target.value)} />
        <select name="job-mode" className={FIELD} value={f.mode} onChange={(e) => set("mode", e.target.value as WorkMode)}>
          {["remote", "hybrid", "onsite"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <select name="job-level" className={FIELD} value={f.level} onChange={(e) => set("level", e.target.value as ExperienceLevel)}>
          {["intern", "entry", "mid", "senior", "lead"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <label className="block"><span className={LABEL}>Posted on</span>
          <input name="job-posted" type="date" className={`mt-1 ${FIELD}`} value={f.posted} onChange={(e) => set("posted", e.target.value)} />
        </label>
        <label className="block"><span className={LABEL}>Company popularity</span>
          <select name="job-popularity" className={`mt-1 ${FIELD}`} value={f.popularity} onChange={(e) => set("popularity", e.target.value as Popularity)}>
            {["low", "medium", "high"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="block"><span className={LABEL}>Applicants (if shown, 0 = unknown)</span>
          <input name="job-applicants" type="number" min={0} className={`mt-1 ${FIELD}`} value={f.applicants} onChange={(e) => set("applicants", Number(e.target.value))} />
        </label>
        <label className="block"><span className={LABEL}>Required skills (optional, auto-detected if blank)</span>
          <input name="job-skills" className={`mt-1 ${FIELD}`} placeholder="React, TypeScript" value={f.skills} onChange={(e) => set("skills", e.target.value)} />
        </label>
      </div>
      <textarea name="job-description" className={FIELD} rows={6} placeholder="Paste the full job description *" value={f.description} onChange={(e) => set("description", e.target.value)} />
      <button disabled={saving} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60">{saving ? "Saving…" : "Analyze job"}</button>
    </form>
  );
}
