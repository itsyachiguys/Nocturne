"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeSkill, type Index, type Level, type Profile } from "@/lib/obliqo/matching";
import {
  BASIC_KEYS, BASIC_LABELS, EMPTY_DETAILS, EMPTY_EDUCATION, EMPTY_EXPERIENCE, EMPTY_PROJECT,
  detailsCompleteness, mergeDetails, saveDetails, subscribeDetails,
  type BasicKey, type Details, type MergeSelection,
} from "@/lib/obliqo/details";
import { parseCv, type ParsedCv } from "@/lib/obliqo/cv";
import { UI } from "@/lib/obliqo/ui";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function ProfileTab({ uid, idx, profile, update }: {
  uid: string; idx: Index; profile: Profile; update: (fn: (p: Profile) => Profile) => void;
}) {
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [err, setErr] = useState<string | null>(null);
  const dirty = useRef(false);

  useEffect(() => subscribeDetails(uid, (d) => { if (!dirty.current) setDetails(d ?? EMPTY_DETAILS); setLoaded(true); }, (e) => setErr(e.message)), [uid]);

  const edit = (fn: (d: Details) => Details) => { dirty.current = true; setSaveState("idle"); setDetails((d) => fn(d)); };
  async function save() {
    setSaveState("saving");
    try { await saveDetails(uid, details); dirty.current = false; setSaveState("saved"); }
    catch (e) { console.error("obliqo details save", e); setSaveState("error"); setErr((e as Error).message); }
  }

  const completeness = useMemo(
    () => detailsCompleteness(details, { targetRole: profile.targetRole, skillCount: profile.skills.length }),
    [details, profile.targetRole, profile.skills.length],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${UI.card} space-y-2 p-4`}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">Profile completeness</h2>
          <span className="text-sm tabular-nums">{completeness.filled} of {completeness.total}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10"><div className="h-1.5 rounded-full bg-violet-500 transition-[width]" style={{ width: `${completeness.percent}%` }} /></div>
        {completeness.missing.length > 0
          ? <p className={`text-xs ${UI.muted}`}>Still missing: {completeness.missing.join(", ")}. A complete profile raises your Life Score.</p>
          : <p className={`text-xs ${UI.muted}`}>Your profile is complete.</p>}
      </section>

      <CvImport idx={idx} profile={profile} update={update} details={details} loaded={loaded}
        onApply={async (merged) => { dirty.current = true; setDetails(merged); await saveDetails(uid, merged); dirty.current = false; setSaveState("saved"); }} />

      {err && <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">{err}</div>}

      <section className={`${UI.card} space-y-3 p-4`}>
        <h2 className="font-semibold">Personal details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {BASIC_KEYS.filter((k) => k !== "summary").map((k) => (
            <Field key={k} label={BASIC_LABELS[k]}>
              <input className={UI.input} value={details[k]} onChange={(e) => edit((d) => ({ ...d, [k as BasicKey]: e.target.value }))} />
            </Field>
          ))}
        </div>
        <Field label={BASIC_LABELS.summary}>
          <textarea className={UI.input} rows={3} value={details.summary} onChange={(e) => edit((d) => ({ ...d, summary: e.target.value }))} />
        </Field>
      </section>

      <ListSection title="Education" addLabel="Add education" onAdd={() => edit((d) => ({ ...d, education: [...d.education, { ...EMPTY_EDUCATION }] }))}>
        {details.education.map((e, i) => (
          <Item key={i} onRemove={() => edit((d) => ({ ...d, education: d.education.filter((_, j) => j !== i) }))}>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["school", "degree", "field", "grade", "start", "end"] as const).map((k) => (
                <input key={k} className={UI.input} placeholder={k[0].toUpperCase() + k.slice(1)} value={e[k]}
                  onChange={(ev) => edit((d) => ({ ...d, education: d.education.map((x, j) => (j === i ? { ...x, [k]: ev.target.value } : x)) }))} />
              ))}
            </div>
          </Item>
        ))}
      </ListSection>

      <ListSection title="Experience" addLabel="Add experience" onAdd={() => edit((d) => ({ ...d, experience: [...d.experience, { ...EMPTY_EXPERIENCE }] }))}>
        {details.experience.map((e, i) => (
          <Item key={i} onRemove={() => edit((d) => ({ ...d, experience: d.experience.filter((_, j) => j !== i) }))}>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["company", "role", "start", "end"] as const).map((k) => (
                <input key={k} className={UI.input} placeholder={k[0].toUpperCase() + k.slice(1)} value={e[k]}
                  onChange={(ev) => edit((d) => ({ ...d, experience: d.experience.map((x, j) => (j === i ? { ...x, [k]: ev.target.value } : x)) }))} />
              ))}
            </div>
            <textarea className={`${UI.input} mt-2`} rows={2} placeholder="What you did" value={e.description}
              onChange={(ev) => edit((d) => ({ ...d, experience: d.experience.map((x, j) => (j === i ? { ...x, description: ev.target.value } : x)) }))} />
          </Item>
        ))}
      </ListSection>

      <ListSection title="Projects" addLabel="Add project" onAdd={() => edit((d) => ({ ...d, projects: [...d.projects, { ...EMPTY_PROJECT }] }))}>
        {details.projects.map((p, i) => (
          <Item key={i} onRemove={() => edit((d) => ({ ...d, projects: d.projects.filter((_, j) => j !== i) }))}>
            <input className={UI.input} placeholder="Project name" value={p.name}
              onChange={(ev) => edit((d) => ({ ...d, projects: d.projects.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)) }))} />
            <textarea className={`${UI.input} mt-2`} rows={2} placeholder="What it does" value={p.description}
              onChange={(ev) => edit((d) => ({ ...d, projects: d.projects.map((x, j) => (j === i ? { ...x, description: ev.target.value } : x)) }))} />
            <input className={`${UI.input} mt-2`} placeholder="Tech used, separated by commas" defaultValue={p.tech.join(", ")}
              onBlur={(ev) => edit((d) => ({ ...d, projects: d.projects.map((x, j) => (j === i ? { ...x, tech: ev.target.value.split(",").map((t) => t.trim()).filter(Boolean) } : x)) }))} />
          </Item>
        ))}
      </ListSection>

      <section className={`${UI.card} space-y-2 p-4`}>
        <h2 className="font-semibold">Certifications</h2>
        <textarea className={UI.input} rows={3} placeholder="One per line" defaultValue={details.certifications.join("\n")} key={details.certifications.join("|")}
          onBlur={(e) => edit((d) => ({ ...d, certifications: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean) }))} />
      </section>

      <div className="sticky bottom-3 flex items-center justify-end gap-3">
        <span className={`text-xs ${UI.muted}`}>
          {saveState === "saving" && "Saving..."}{saveState === "saved" && "Saved"}{saveState === "error" && <span className="text-rose-600">Couldn&apos;t save</span>}
        </span>
        <button className={`${UI.btn} ${UI.btnPrimary}`} disabled={!loaded || saveState === "saving"} onClick={save}>Save details</button>
      </div>
    </div>
  );
}

/* ============================ CV import ============================ */

function CvImport({ idx, profile, update, details, loaded, onApply }: {
  idx: Index; profile: Profile; update: (fn: (p: Profile) => Profile) => void;
  details: Details; loaded: boolean; onApply: (merged: Details) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCv | null>(null);
  const [sel, setSel] = useState<MergeSelection>({ basics: true, education: true, experience: true, projects: true, certifications: true });
  const [overwrite, setOverwrite] = useState(false);
  const [skipSkills, setSkipSkills] = useState<Set<string>>(new Set());
  const [useSkills, setUseSkills] = useState(true);

  // CV skills mapped to your canonical skill names, minus the ones you already have.
  const newSkills = useMemo(() => {
    if (!parsed) return [];
    const have = new Set(profile.skills.map((s) => s.name.toLowerCase()));
    const out: string[] = [];
    for (const raw of parsed.skills) for (const n of normalizeSkill(idx, raw)) {
      if (!have.has(n.toLowerCase()) && !out.some((o) => o.toLowerCase() === n.toLowerCase())) out.push(n);
    }
    return out;
  }, [parsed, idx, profile.skills]);

  async function read() {
    if (!file) return;
    setBusy(true); setError(null); setDone(null); setParsed(null);
    try { setParsed(await parseCv(file)); setSkipSkills(new Set()); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function apply() {
    if (!parsed) return;
    setBusy(true); setError(null);
    try {
      await onApply(mergeDetails(details, parsed.details, sel, overwrite));
      const picked = newSkills.filter((n) => !skipSkills.has(n));
      if (useSkills && picked.length) {
        update((p) => ({ ...p, skills: [...p.skills, ...picked.filter((n) => !p.skills.some((s) => s.name.toLowerCase() === n.toLowerCase())).map((name) => ({ name, level: 2 as Level }))] }));
      }
      setDone(`Imported${useSkills && picked.length ? ` with ${picked.length} new skill${picked.length === 1 ? "" : "s"} (set to Intermediate, change them on My Skills)` : ""}.`);
      setParsed(null); setFile(null);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const p = parsed?.details;
  const toggle = (k: keyof MergeSelection) => setSel((s) => ({ ...s, [k]: !s[k] }));

  return (
    <section className={`${UI.card} space-y-3 p-4`}>
      <div>
        <h2 className="font-semibold">Import from your CV</h2>
        <p className={`text-sm ${UI.muted}`}>Upload a PDF, Word or text file. You will review what was found before anything is saved.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input type="file" accept=".pdf,.docx,.txt,application/pdf" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setParsed(null); setDone(null); setError(null); }}
          className="text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white" />
        <button className={`${UI.btn} ${UI.btnPrimary}`} disabled={!file || busy || !loaded} onClick={read}>{busy && !parsed ? "Reading..." : "Read CV"}</button>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {done && <p className="text-sm text-emerald-600 dark:text-emerald-400">{done}</p>}

      {p && (
        <div className="space-y-3 rounded-xl border border-violet-300/50 p-3 dark:border-violet-400/30">
          <p className="text-sm font-medium">Found in your CV. Untick anything you don&apos;t want.</p>

          <Check on={sel.basics} onChange={() => toggle("basics")} label="Contact, headline and links">
            <dl className="mt-1 grid gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2">
              {BASIC_KEYS.filter((k) => p[k]).map((k) => (
                <div key={k} className="min-w-0"><dt className={`inline ${UI.muted}`}>{BASIC_LABELS[k]}: </dt><dd className="inline break-words">{p[k].length > 90 ? `${p[k].slice(0, 90)}...` : p[k]}{details[k] && details[k] !== p[k] ? <span className={UI.muted}> (you have: {details[k].slice(0, 40)})</span> : null}</dd></div>
              ))}
            </dl>
            <label className="mt-1.5 flex items-center gap-2 text-xs"><input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> Replace fields that already have a value</label>
          </Check>
          <Check on={sel.education} onChange={() => toggle("education")} label={`Education (${p.education.length})`} disabled={!p.education.length}>
            <Lines items={p.education.map((e) => `${e.degree || "Degree"}${e.field ? `, ${e.field}` : ""} at ${e.school || "school"}`)} />
          </Check>
          <Check on={sel.experience} onChange={() => toggle("experience")} label={`Experience (${p.experience.length})`} disabled={!p.experience.length}>
            <Lines items={p.experience.map((e) => `${e.role || "Role"} at ${e.company || "company"}`)} />
          </Check>
          <Check on={sel.projects} onChange={() => toggle("projects")} label={`Projects (${p.projects.length})`} disabled={!p.projects.length}>
            <Lines items={p.projects.map((x) => x.name)} />
          </Check>
          <Check on={sel.certifications} onChange={() => toggle("certifications")} label={`Certifications (${p.certifications.length})`} disabled={!p.certifications.length}>
            <Lines items={p.certifications} />
          </Check>
          <Check on={useSkills} onChange={() => setUseSkills((v) => !v)} label={`New skills (${newSkills.length})`} disabled={!newSkills.length}>
            <div className="mt-1 flex flex-wrap gap-1">
              {newSkills.map((n) => {
                const off = skipSkills.has(n);
                return <button key={n} type="button" onClick={() => setSkipSkills((s) => { const x = new Set(s); if (x.has(n)) x.delete(n); else x.add(n); return x; })}
                  className={`${UI.chip} ${off ? "border-slate-300 text-slate-400 line-through dark:border-white/15" : "border-violet-400 text-violet-700 dark:text-violet-300"}`}>{n}</button>;
              })}
            </div>
            {!newSkills.length && <p className={`text-xs ${UI.muted}`}>No new skills (you already have them all).</p>}
          </Check>

          <div className="flex gap-2">
            <button className={`${UI.btn} ${UI.btnPrimary}`} disabled={busy} onClick={apply}>{busy ? "Saving..." : "Save to my profile"}</button>
            <button className={`${UI.btn} ${UI.btnGhost}`} disabled={busy} onClick={() => setParsed(null)}>Discard</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================== bits =============================== */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className={`text-xs ${UI.muted}`}>{label}</span>{children}</label>;
}
function ListSection({ title, addLabel, onAdd, children }: { title: string; addLabel: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <section className={`${UI.card} space-y-3 p-4`}>
      <div className="flex items-center justify-between"><h2 className="font-semibold">{title}</h2><button className={`${UI.btn} ${UI.btnGhost} !py-1 !text-xs`} onClick={onAdd}>{addLabel}</button></div>
      {children}
    </section>
  );
}
function Item({ onRemove, children }: { onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
      {children}
      <button className="mt-2 text-xs text-rose-600 hover:underline" onClick={onRemove}>Remove</button>
    </div>
  );
}
function Check({ on, onChange, label, disabled, children }: { on: boolean; onChange: () => void; label: string; disabled?: boolean; children?: React.ReactNode }) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={on && !disabled} disabled={disabled} onChange={onChange} /> {label}</label>
      <div className="pl-6">{children}</div>
    </div>
  );
}
function Lines({ items }: { items: string[] }) {
  return <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">{items.slice(0, 6).map((t, i) => <li key={i}>{t}</li>)}{items.length > 6 && <li className={UI.muted}>and {items.length - 6} more</li>}</ul>;
}
