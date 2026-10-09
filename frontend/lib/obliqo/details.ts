import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Personal / profile details, kept apart from the skills profile so the existing saveProfile() never overwrites them.
 *   users/{uid}/obliqo/details -> Details   (covered by the existing users/{uid}/{document=**} rule)
 */
export interface Education { school: string; degree: string; field: string; start: string; end: string; grade: string }
export interface Experience { company: string; role: string; start: string; end: string; description: string }
export interface Project { name: string; description: string; tech: string[] }
export interface Details {
  fullName: string; email: string; phone: string; location: string;
  headline: string; summary: string;
  linkedin: string; github: string; portfolio: string;
  education: Education[]; experience: Experience[]; projects: Project[]; certifications: string[];
}

export const BASIC_KEYS = ["fullName", "email", "phone", "location", "headline", "summary", "linkedin", "github", "portfolio"] as const;
export type BasicKey = (typeof BASIC_KEYS)[number];
export const BASIC_LABELS: Record<BasicKey, string> = {
  fullName: "Full name", email: "Email", phone: "Phone", location: "Location", headline: "Headline",
  summary: "Summary", linkedin: "LinkedIn", github: "GitHub", portfolio: "Portfolio / website",
};

export const EMPTY_EDUCATION: Education = { school: "", degree: "", field: "", start: "", end: "", grade: "" };
export const EMPTY_EXPERIENCE: Experience = { company: "", role: "", start: "", end: "", description: "" };
export const EMPTY_PROJECT: Project = { name: "", description: "", tech: [] };
export const EMPTY_DETAILS: Details = {
  fullName: "", email: "", phone: "", location: "", headline: "", summary: "",
  linkedin: "", github: "", portfolio: "",
  education: [], experience: [], projects: [], certifications: [],
};

const s = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown, n: number) => (Array.isArray(v) ? v.slice(0, n) : []);
export const cleanList = (v: unknown, n = 60, max = 80): string[] =>
  list(v, n).map((x) => s(x, max)).filter(Boolean);

/** Accepts anything (Firestore data or model output) and returns a safe Details. */
export function cleanDetails(raw: unknown): Details {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Details = { ...EMPTY_DETAILS, education: [], experience: [], projects: [], certifications: [] };
  for (const k of BASIC_KEYS) out[k] = s(d[k], k === "summary" ? 1200 : 300);
  out.education = list(d.education, 12).map((e) => {
    const x = (e ?? {}) as Record<string, unknown>;
    return { school: s(x.school), degree: s(x.degree), field: s(x.field), start: s(x.start, 40), end: s(x.end, 40), grade: s(x.grade, 40) };
  }).filter((e) => e.school || e.degree);
  out.experience = list(d.experience, 20).map((e) => {
    const x = (e ?? {}) as Record<string, unknown>;
    return { company: s(x.company), role: s(x.role), start: s(x.start, 40), end: s(x.end, 40), description: s(x.description, 1200) };
  }).filter((e) => e.company || e.role);
  out.projects = list(d.projects, 20).map((p) => {
    const x = (p ?? {}) as Record<string, unknown>;
    return { name: s(x.name), description: s(x.description, 1200), tech: cleanList(x.tech, 20, 40) };
  }).filter((p) => p.name);
  out.certifications = cleanList(d.certifications, 30, 160);
  return out;
}

export function subscribeDetails(uid: string, cb: (d: Details | null) => void, onError?: (e: Error) => void) {
  return onSnapshot(doc(db, "users", uid, "obliqo", "details"), (snap) => cb(snap.exists() ? cleanDetails(snap.data()) : null), (e) => onError?.(e));
}
export async function saveDetails(uid: string, d: Details) {
  await setDoc(doc(db, "users", uid, "obliqo", "details"), { ...JSON.parse(JSON.stringify(cleanDetails(d))), updatedAt: serverTimestamp() });
}

/* ---- merging a CV import into the current details ---- */
export interface MergeSelection { basics: boolean; education: boolean; experience: boolean; projects: boolean; certifications: boolean }
const norm = (...parts: string[]) => parts.map((p) => p.trim().toLowerCase()).join("|");

export function mergeDetails(cur: Details, inc: Details, sel: MergeSelection, overwrite: boolean): Details {
  const out: Details = { ...cur, education: [...cur.education], experience: [...cur.experience], projects: [...cur.projects], certifications: [...cur.certifications] };
  if (sel.basics) for (const k of BASIC_KEYS) if (inc[k] && (overwrite || !cur[k])) out[k] = inc[k];
  if (sel.education) {
    const seen = new Set(cur.education.map((e) => norm(e.school, e.degree)));
    for (const e of inc.education) if (!seen.has(norm(e.school, e.degree))) out.education.push(e);
  }
  if (sel.experience) {
    const seen = new Set(cur.experience.map((e) => norm(e.company, e.role)));
    for (const e of inc.experience) if (!seen.has(norm(e.company, e.role))) out.experience.push(e);
  }
  if (sel.projects) {
    const seen = new Set(cur.projects.map((p) => norm(p.name)));
    for (const p of inc.projects) if (!seen.has(norm(p.name))) out.projects.push(p);
  }
  if (sel.certifications) {
    const seen = new Set(cur.certifications.map((c) => norm(c)));
    for (const c of inc.certifications) if (!seen.has(norm(c))) out.certifications.push(c);
  }
  return out;
}

/* ---- profile completeness (used by the Life Score) ---- */
export interface Completeness { percent: number; filled: number; total: number; missing: string[] }

export function detailsCompleteness(d: Details | null, p: { targetRole: string | null; skillCount: number }): Completeness {
  const x = d ?? EMPTY_DETAILS;
  const checks: [string, boolean][] = [
    ["Name and contact (email or phone)", !!x.fullName && !!(x.email || x.phone)],
    ["Headline or summary", !!(x.headline || x.summary)],
    ["Target role", !!p.targetRole],
    ["At least 3 skills", p.skillCount >= 3],
    ["Education", x.education.length > 0],
    ["Experience or a project", x.experience.length + x.projects.length > 0],
    ["A profile link (LinkedIn, GitHub or portfolio)", !!(x.linkedin || x.github || x.portfolio)],
  ];
  const filled = checks.filter(([, ok]) => ok).length;
  return { percent: (filled / checks.length) * 100, filled, total: checks.length, missing: checks.filter(([, ok]) => !ok).map(([n]) => n) };
}
