"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { OpportunityService } from "@/services/OpportunityService";
import { cosine, embedTexts, semanticScore } from "@/lib/obliqo/embeddings";
import { analyzeJob } from "@/lib/obliqo/scoring";
import { parseList } from "@/lib/obliqo/skills";
import type { Decision, ExperienceLevel, Job, JobAnalysis, Popularity, UserProfile, WorkMode } from "@/lib/obliqo/types";
import JobCard from "./JobCard";

const MAX_JOBS = 40;
const input = "w-full rounded border border-gray-300 px-3 py-2 text-sm";
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
      <div className="rounded border border-dashed p-6 text-center">
        <p className="mb-3 text-gray-700">Set up your profile first so jobs can be matched to you.</p>
        <button onClick={onEditProfile} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white">Create profile</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 text-sm">
          {(["all", "apply", "wait", "skip", "avoid"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded border px-3 py-1 capitalize ${filter === f ? "bg-indigo-600 text-white" : "bg-white text-gray-700"}`}>{f}</button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white">{showForm ? "Close" : "+ Add job"}</button>
      </div>

      {source === "local" && (
        <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">
          Using built-in keyword-based similarity. Configure EMBEDDINGS_API_KEY on the server to enable true semantic embeddings.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {showForm && <AddJobForm uid={user.uid} onAdded={(j) => { setJobs((cur) => [j, ...cur]); setShowForm(false); }} onError={setError} />}

      {loading ? <p className="text-gray-500">Loading jobs…</p> : !jobs.length ? (
        <p className="text-gray-600">No jobs yet. Add a job posting to see your fit score and recommendation.</p>
      ) : (
        <div className="space-y-3">
          {ranked.map((j) => <JobCard key={j.id} job={j} analysis={analyses[j.id!]} onDelete={() => remove(j)} onPlan={() => plan(j)} />)}
          {jobs.length > MAX_JOBS && <p className="text-xs text-gray-500">Only your {MAX_JOBS} newest jobs are analyzed.</p>}
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

  async function submit(e: React.FormEvent) {
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
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-gray-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Job title *" value={f.title} onChange={(e) => set("title", e.target.value)} />
        <input className={input} placeholder="Company" value={f.company} onChange={(e) => set("company", e.target.value)} />
        <input className={input} placeholder="Location" value={f.location} onChange={(e) => set("location", e.target.value)} />
        <input className={input} placeholder="Job link (optional)" value={f.url} onChange={(e) => set("url", e.target.value)} />
        <select className={input} value={f.mode} onChange={(e) => set("mode", e.target.value as WorkMode)}>
          {["remote", "hybrid", "onsite"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <select className={input} value={f.level} onChange={(e) => set("level", e.target.value as ExperienceLevel)}>
          {["intern", "entry", "mid", "senior", "lead"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <label className="text-xs text-gray-600">Posted on<input type="date" className={input} value={f.posted} onChange={(e) => set("posted", e.target.value)} /></label>
        <label className="text-xs text-gray-600">Company popularity
          <select className={input} value={f.popularity} onChange={(e) => set("popularity", e.target.value as Popularity)}>
            {["low", "medium", "high"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-600">Applicants (if shown, 0 = unknown)
          <input type="number" min={0} className={input} value={f.applicants} onChange={(e) => set("applicants", Number(e.target.value))} />
        </label>
        <label className="text-xs text-gray-600">Required skills (optional, auto-detected if blank)
          <input className={input} placeholder="React, TypeScript" value={f.skills} onChange={(e) => set("skills", e.target.value)} />
        </label>
      </div>
      <textarea className={input} rows={6} placeholder="Paste the full job description *" value={f.description} onChange={(e) => set("description", e.target.value)} />
      <button disabled={saving} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? "Saving…" : "Analyze job"}</button>
    </form>
  );
}
