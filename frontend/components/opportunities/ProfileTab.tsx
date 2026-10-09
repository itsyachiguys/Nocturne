"use client";

import { useState, type FormEvent } from "react";
import { OpportunityService } from "@/services/OpportunityService";
import { parseList } from "@/lib/obliqo/skills";
import type { ExperienceLevel, UserProfile, WorkMode } from "@/lib/obliqo/types";
import { FIELD, LABEL, chip } from "./styles";

const LEVELS: ExperienceLevel[] = ["intern", "entry", "mid", "senior", "lead"];
const MODES: WorkMode[] = ["remote", "hybrid", "onsite"];

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

  async function save(e: FormEvent) {
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
    <form onSubmit={save} className="card space-y-5 p-6">
      <label className="block"><span className={LABEL}>Headline</span>
        <input name="headline" className={`mt-1 ${FIELD}`} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Frontend developer" />
      </label>
      <label className="block"><span className={LABEL}>About you</span>
        <textarea name="summary" className={`mt-1 ${FIELD}`} rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Projects, experience and what you're good at. This is used for semantic matching." />
      </label>
      <label className="block"><span className={LABEL}>Skills (comma-separated)</span>
        <input name="skills" className={`mt-1 ${FIELD}`} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Firebase, Git" />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block"><span className={LABEL}>Years of experience</span>
          <input name="years" type="number" min={0} className={`mt-1 ${FIELD}`} value={years} onChange={(e) => setYears(Number(e.target.value))} />
        </label>
        <label className="block"><span className={LABEL}>Current level</span>
          <select name="level" className={`mt-1 ${FIELD}`} value={level} onChange={(e) => setLevel(e.target.value as ExperienceLevel)}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
      </div>
      <label className="block"><span className={LABEL}>Career goals</span>
        <textarea name="goals" className={`mt-1 ${FIELD}`} rows={2} value={goals} onChange={(e) => setGoals(e.target.value)} />
      </label>
      <label className="block"><span className={LABEL}>Target roles (comma-separated)</span>
        <input name="roles" className={`mt-1 ${FIELD}`} value={roles} onChange={(e) => setRoles(e.target.value)} placeholder="Frontend developer, Full stack engineer" />
      </label>
      <div>
        <span className={LABEL}>Preferred work mode</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button key={m} type="button" aria-pressed={modes.includes(m)} onClick={() => toggleMode(m)} className={chip(modes.includes(m))}>{m}</button>
          ))}
        </div>
      </div>
      <label className="block"><span className={LABEL}>Preferred locations (comma-separated)</span>
        <input name="locations" className={`mt-1 ${FIELD}`} value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="Ahmedabad, Bengaluru" />
      </label>
      {error && <p className="text-sm text-coral">{error}</p>}
      <button disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-60">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
