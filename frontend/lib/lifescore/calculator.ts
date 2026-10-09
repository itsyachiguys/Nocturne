/**
 * Student Life Score (0-100). Web port of the Android LifeScoreCalculator.
 * Pure TypeScript: no React, no Firebase.
 *
 * Weights: Courses & activities 25, Syllabus 20, CGPA 20, Career (Obliqo) 20, Attendance 15.
 * Attendance is deliberately the smallest share. Parts with no data are left out and the rest are rescaled.
 */
export const WEIGHTS = { attendance: 15, syllabus: 20, cgpa: 20, activities: 25, career: 20 } as const; // sums to 100
export const CGPA_SCALE_MAX = 10;
/** Completed courses / extracurriculars needed for a full 100% in the activities part. */
export const ACTIVITY_TARGET = 5;
/** Career part = 60% profile completeness + 40% job activity. Activity: this many applications = 100% (a saved job counts a quarter). */
export const APPLIED_TARGET = 5;
export const SAVED_CREDIT = 0.25;
export const CAREER_PROFILE_SHARE = 0.6;

export type PartKey = keyof typeof WEIGHTS;

export interface Part {
  has: boolean;       // false when the input was missing
  percent: number;    // 0-100 (CGPA normalised to 0-100)
  points: number;     // what it contributed to the score
  maxPoints: number;  // the most it could have contributed (0 for a missing part in skipMissing mode)
  weight: number;     // the nominal weight
}
export interface Breakdown {
  score: number;      // rounded 0-100
  label: string;
  partial: boolean;   // at least one input missing
  parts: Record<PartKey, Part>;
}
export interface Inputs {
  attendance?: number | null;
  syllabus?: number | null;
  cgpa?: number | null;
  activities?: number | null; // already a 0-100 percentage
  career?: number | null;     // already a 0-100 percentage
}
export interface Options {
  /** Leave missing inputs out and scale the remaining weights to 100 (default false: missing counts as 0). */
  skipMissing?: boolean;
  cgpaScaleMax?: number; // default 10
}

const valid = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function lifeScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Great";
  if (score >= 50) return "Good";
  if (score >= 30) return "Needs attention";
  return "At risk";
}

export function computeLifeScore(input: Inputs, opts: Options = {}): Breakdown {
  const scaleMax = opts.cgpaScaleMax && opts.cgpaScaleMax > 0 ? opts.cgpaScaleMax : CGPA_SCALE_MAX;
  const keys = Object.keys(WEIGHTS) as PartKey[];
  const has = {} as Record<PartKey, boolean>;
  const pct = {} as Record<PartKey, number>;
  for (const k of keys) {
    const v = input[k];
    has[k] = valid(v);
    if (!has[k]) pct[k] = 0;
    else if (k === "cgpa") pct[k] = clamp(((v as number) / scaleMax) * 100, 0, 100);
    else pct[k] = clamp(v as number, 0, 100);
  }
  const present = keys.reduce((sum, k) => sum + (has[k] ? WEIGHTS[k] : 0), 0);
  const scale = opts.skipMissing ? (present > 0 ? 100 / present : 0) : 1;

  let total = 0;
  const parts = {} as Record<PartKey, Part>;
  for (const k of keys) {
    const maxPoints = opts.skipMissing ? (has[k] ? WEIGHTS[k] * scale : 0) : WEIGHTS[k];
    const points = (pct[k] * maxPoints) / 100;
    total += points;
    parts[k] = { has: has[k], percent: pct[k], points, maxPoints, weight: WEIGHTS[k] };
  }
  const score = Math.round(clamp(total, 0, 100));
  return { score, label: lifeScoreLabel(score), partial: keys.some((k) => !has[k]), parts };
}

/** done / total as a percentage, or null when there is nothing to measure yet. */
export function percent(done: number, total: number): number | null {
  return total > 0 ? clamp((done * 100) / total, 0, 100) : null;
}

/** Mean of the finite values (e.g. completion % per subject), or null if there are none. */
export function average(values: Array<number | null | undefined>): number | null {
  const v = values.filter(valid);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
