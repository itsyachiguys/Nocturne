import { doc, collection, onSnapshot, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EMPTY_PROFILE, DEFAULT_FILTERS, type Profile, type Level, type Dataset, type Filters, type PlanOverride, type PlanStep, type Schedule, clampSchedule } from "./matching";
import { safeUrl, type Course } from "./courses";

/**
 * Firestore layout (covered by the existing `users/{uid}/{document=**}` rule, so no rules change):
 *   users/{uid}/obliqo/profile        -> { targetRole, skills[], planSkills[], planDone{}, planEdits{ [skill]: { steps?, courses[] } } }
 *   users/{uid}/obliqo/prefs          -> { filters, sort, tab }   (UI state, restored on next visit)
 *   users/{uid}/obliqoJobs/{jobId}    -> { status: "saved" | "applied" }
 */
const profileRef = (uid: string) => doc(db, "users", uid, "obliqo", "profile");
const jobsCol = (uid: string) => collection(db, "users", uid, "obliqoJobs");

export type JobStatus = "saved" | "applied";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function cleanSteps(raw: unknown): PlanStep[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter((s) => s && typeof s.id === "string")
    .map((s) => ({ id: String(s.id), week: Math.max(1, Math.min(52, Math.round(Number(s.week) || 1))), title: str(s.title, 120), detail: str(s.detail, 400), ...(Number(s.hours) > 0 ? { hours: Math.min(500, Number(s.hours)) } : {}),
      ...(Array.isArray(s.points) ? { points: s.points.map((x: unknown) => str(x, 200).trim()).filter(Boolean).slice(0, 8) } : {}),
      ...(s.resource && safeUrl(str(s.resource.url, 500)) ? { resource: { label: str(s.resource.label, 120), url: safeUrl(str(s.resource.url, 500)) as string } } : {}),
      ...(typeof s.phase === "string" ? { phase: str(s.phase, 20) } : {}) }));
}
function cleanCourses(raw: unknown): Course[] {
  if (!Array.isArray(raw)) return [];
  const out: Course[] = [];
  for (const c of raw) {
    const url = c && typeof c.url === "string" ? safeUrl(c.url) : null;
    if (!url || typeof c.id !== "string") continue;
    out.push({ id: c.id, title: str(c.title, 160) || url, provider: str(c.provider, 80), url, free: !!c.free, ...(c.note ? { note: str(c.note, 200) } : {}), ...(c.custom ? { custom: true } : {}) });
  }
  return out;
}
function cleanEdits(raw: unknown): Record<string, PlanOverride> {
  const out: Record<string, PlanOverride> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [skill, v] of Object.entries(raw as Record<string, { steps?: unknown; courses?: unknown; schedule?: Partial<Schedule>; goal?: unknown }>)) {
    const steps = cleanSteps(v?.steps);
    const sc = v?.schedule;
    const schedule = sc && typeof sc === "object" ? clampSchedule({ weeks: Number(sc.weeks), hoursPerDay: Number(sc.hoursPerDay), daysPerWeek: Number(sc.daysPerWeek) }) : undefined;
    out[skill] = { ...(steps ? { steps } : {}), courses: cleanCourses(v?.courses), ...(schedule ? { schedule } : {}), ...(v?.goal === 1 || v?.goal === 2 || v?.goal === 3 ? { goal: v.goal as Level } : {}) };
  }
  return out;
}

export function subscribeProfile(uid: string, cb: (p: Profile) => void, onError?: (e: Error) => void) {
  return onSnapshot(
    profileRef(uid),
    (snap) => {
      const d = snap.data() as Partial<Profile> | undefined;
      cb({
        targetRole: d?.targetRole ?? null,
        skills: (d?.skills ?? []).filter((s) => s && s.name).map((s) => ({ name: s.name, level: ([1, 2, 3].includes(s.level) ? s.level : 2) as Level })),
        planSkills: d?.planSkills ?? [],
        planDone: d?.planDone ?? {},
        planEdits: cleanEdits(d?.planEdits),
      });
    },
    (e) => onError?.(e),
  );
}

export async function saveProfile(uid: string, p: Profile) {
  // JSON round-trip drops `undefined` values, which Firestore rejects.
  await setDoc(profileRef(uid), { ...JSON.parse(JSON.stringify(p)), updatedAt: serverTimestamp() });
}

/* ---- UI preferences: filters, sort and the open tab ---- */
export type Tab = "jobs" | "skills" | "plans" | "saved";
export type Sort = "match" | "stipend" | "newest";
export interface Prefs { filters: Filters; sort: Sort; tab: Tab }
const prefsRef = (uid: string) => doc(db, "users", uid, "obliqo", "prefs");

export async function loadPrefs(uid: string): Promise<Partial<Prefs> | null> {
  const snap = await getDoc(prefsRef(uid));
  if (!snap.exists()) return null;
  const d = snap.data() as Partial<Prefs>;
  const out: Partial<Prefs> = {};
  if (d.filters && typeof d.filters === "object") out.filters = { ...DEFAULT_FILTERS, ...d.filters };
  if (d.sort === "match" || d.sort === "stipend" || d.sort === "newest") out.sort = d.sort;
  if (d.tab === "jobs" || d.tab === "skills" || d.tab === "plans" || d.tab === "saved") out.tab = d.tab;
  return out;
}
export async function savePrefs(uid: string, p: Prefs) {
  await setDoc(prefsRef(uid), { ...JSON.parse(JSON.stringify(p)), updatedAt: serverTimestamp() });
}

export function subscribeJobStatus(uid: string, cb: (m: Record<string, JobStatus>) => void, onError?: (e: Error) => void) {
  return onSnapshot(
    jobsCol(uid),
    (snap) => {
      const m: Record<string, JobStatus> = {};
      snap.forEach((d) => { const s = d.data().status; if (s === "saved" || s === "applied") m[d.id] = s; });
      cb(m);
    },
    (e) => onError?.(e),
  );
}

export async function setJobStatus(uid: string, jobId: string, status: JobStatus | null) {
  const ref = doc(db, "users", uid, "obliqoJobs", jobId);
  if (status === null) await deleteDoc(ref);
  else await setDoc(ref, { status, updatedAt: serverTimestamp() });
}

/* The dataset is a static file in /public; fetch once and cache. */
let datasetPromise: Promise<Dataset> | null = null;
export function loadDataset(): Promise<Dataset> {
  if (!datasetPromise) {
    datasetPromise = fetch("/obliqo/jobs.json").then((r) => {
      if (!r.ok) throw new Error(`Could not load jobs (${r.status})`);
      return r.json() as Promise<Dataset>;
    }).catch((e) => { datasetPromise = null; throw e; });
  }
  return datasetPromise;
}

export { EMPTY_PROFILE };
