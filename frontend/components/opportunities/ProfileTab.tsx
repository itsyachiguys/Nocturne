"use client";

import { useState } from "react";
import { OpportunityService } from "@/services/OpportunityService";
import { parseList } from "@/lib/obliqo/skills";
import type { ExperienceLevel, UserProfile, WorkMode } from "@/lib/obliqo/types";

const LEVELS: ExperienceLevel[] = ["intern", "entry", "mid", "senior", "lead"];
const MODES: WorkMode[] = ["remote", "hybrid", "onsite"];
const input = "w-full rounded border border-gray-300 px-3 py-2 text-sm";

export default function ProfileTab({ uid, profile, onSaved }: { uid: string; profile: UserProfile | null; onSaved: (p: UserProfile) => void }) {
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [summary, setSummary] = useState(profile?.summary ?? "");
  const [skills, setSkills] = useState((profile?.skills ?? []).join(", "));
  const [years, setYears] = useState(profile?.yearsExperience ?? 0);
  const [level, setLevel] = useState<ExperienceLevel>(profile?.level ?? "entry");
  const [goals, setGoals] = useState(profile?.goals ?? "");
  const [roles, setRoles] = useState((profile?.targetRoles ?? []).join(", "));
  const [modes, setModes] = useState<WorkMode[]>(profile?.preferredModes ?? []);
  const [locations, setLocations] = useState((profile?.preferredLocations ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleMode = (m: WorkMode) => setModes((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const skillList = parseList(skills);
    if (!skillList.length) return setError("Add at least one skill so matching has something to work with.");
    setSaving(true);
    try {
      const p: UserProfile = {
        userId: uid, headline: headline.trim(), summary: summary.trim(), skills: skillList,
        yearsExperience: Number(years) || 0, level, goals: goals.trim(), targetRoles: parseList(roles),
        preferredModes: modes, preferredLocations: parseList(locations), updatedAt: Date.now(),
      };
      await OpportunityService.saveProfile(p);
      onSaved(p);
    } catch {
      setError("Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <label className="block text-sm font-medium">Headline
        <input className={input} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Frontend developer" />
      </label>
      <label className="block text-sm font-medium">About you
        <textarea className={input} rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Projects, experience and what you're good at. This is used for semantic matching." />
      </label>
      <label className="block text-sm font-medium">Skills (comma-separated)
        <input className={input} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Firebase, Git" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Years of experience
          <input type="number" min={0} className={input} value={years} onChange={(e) => setYears(Number(e.target.value))} />
        </label>
        <label className="block text-sm font-medium">Current level
          <select className={input} value={level} onChange={(e) => setLevel(e.target.value as ExperienceLevel)}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">Career goals
        <textarea className={input} rows={2} value={goals} onChange={(e) => setGoals(e.target.value)} />
      </label>
      <label className="block text-sm font-medium">Target roles (comma-separated)
        <input className={input} value={roles} onChange={(e) => setRoles(e.target.value)} placeholder="Frontend developer, Full stack engineer" />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Preferred work mode</legend>
        <div className="mt-1 flex gap-4">
          {MODES.map((m) => (
            <label key={m} className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={modes.includes(m)} onChange={() => toggleMode(m)} /> {m}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium">Preferred locations (comma-separated)
        <input className={input} value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="Ahmedabad, Bengaluru" />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={saving} className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
