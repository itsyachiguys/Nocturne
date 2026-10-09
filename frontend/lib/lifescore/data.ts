import { doc, collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ACTIVITY_TARGET, APPLIED_TARGET, CAREER_PROFILE_SHARE, SAVED_CREDIT, average, percent } from "./calculator";
import { cleanDetails, detailsCompleteness, type Details } from "@/lib/obliqo/details";

/**
 * Where each input lives in Firestore (matches the rest of the app):
 *
 *   users/{uid}                       -> { cgpa: 8.2 }
 *   attendance/{id}                   -> { studentId, subjectId, status: "present" | "absent", ... }   (one doc per class)
 *   subjects/{id}                     -> { studentId, name, progress: 0-100, ... }
 *   users/{uid}/activities/{id}       -> { title, type, completed: true | false }
 *   users/{uid}/obliqo/profile        -> { targetRole, skills[] }        (Obliqo skills profile)
 *   users/{uid}/obliqo/details        -> personal details saved from the CV import / Profile tab
 *   users/{uid}/obliqoJobs/{jobId}    -> { status: "saved" | "applied" } (Obliqo tracker)
 *
 * Attendance = present records / all records, across all subjects (same sum as the Attendance page).
 * Syllabus   = average of each subject's `progress`.
 * Activities = completed items as a % of ACTIVITY_TARGET.
 * Career     = 60% Obliqo profile completeness + 40% job activity ((applied + 0.25 x saved) / APPLIED_TARGET).
 */
export const SOURCES = {
  cgpaField: "cgpa",
  attendanceCollection: "attendance",
  subjectsCollection: "subjects",
  ownerField: "studentId",
  statusField: "status",
  presentValue: "present",
  progressField: "progress",
  activitiesCollection: "activities",
  completedField: "completed",
};

export interface LifeScoreInputs {
  attendance: number | null;
  syllabus: number | null;
  cgpa: number | null;
  /** Completed courses/extracurriculars as a % of ACTIVITY_TARGET; null when none have been added. */
  activities: number | null;
  activitiesDone: number;
  activitiesTotal: number;
  /** Obliqo career readiness 0-100; null until the student has any Obliqo profile data or tracked job. */
  career: number | null;
  careerProfile: number; // profile completeness %
  careerApplied: number;
  careerSaved: number;
  subjects: number;
}

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

export function subscribeLifeScoreInputs(uid: string, cb: (i: LifeScoreInputs) => void, onError?: (e: Error) => void) {
  let cgpa: number | null = null;
  let attendance: number | null = null;
  let syllabus: number | null = null;
  let subjects = 0;
  let activities: number | null = null, activitiesDone = 0, activitiesTotal = 0;
  let obProfile: { targetRole: string | null; skillCount: number } = { targetRole: null, skillCount: 0 };
  let obDetails: Details | null = null;
  let applied = 0, saved = 0;
  let career: number | null = null, careerProfile = 0;
  const got = { user: false, subjects: false, attendance: false, activities: false, obProfile: false, obDetails: false, obJobs: false };
  const recomputeCareer = () => {
    const c = detailsCompleteness(obDetails, obProfile);
    careerProfile = c.percent;
    const hasAny = c.filled > 0 || applied + saved > 0;
    const activity = Math.min(100, ((applied + SAVED_CREDIT * saved) / APPLIED_TARGET) * 100);
    career = hasAny ? CAREER_PROFILE_SHARE * c.percent + (1 - CAREER_PROFILE_SHARE) * activity : null;
  };
  const emit = () => {
    if (Object.values(got).every(Boolean)) {
      cb({ attendance, syllabus, cgpa, activities, activitiesDone, activitiesTotal, career, careerProfile, careerApplied: applied, careerSaved: saved, subjects });
    }
  };

  const u1 = onSnapshot(doc(db, "users", uid), (snap) => {
    cgpa = num(snap.data()?.[SOURCES.cgpaField]);
    got.user = true; emit();
  }, (e) => onError?.(e));

  const u2 = onSnapshot(
    query(collection(db, SOURCES.subjectsCollection), where(SOURCES.ownerField, "==", uid)),
    (snap) => {
      subjects = snap.size;
      syllabus = average(snap.docs.map((d) => num(d.data()[SOURCES.progressField])));
      got.subjects = true; emit();
    },
    (e) => onError?.(e),
  );

  const u3 = onSnapshot(
    query(collection(db, SOURCES.attendanceCollection), where(SOURCES.ownerField, "==", uid)),
    (snap) => {
      const present = snap.docs.filter((d) => d.data()[SOURCES.statusField] === SOURCES.presentValue).length;
      attendance = percent(present, snap.size);
      got.attendance = true; emit();
    },
    (e) => onError?.(e),
  );

  const u4 = onSnapshot(collection(db, "users", uid, SOURCES.activitiesCollection), (snap) => {
    activitiesTotal = snap.size;
    activitiesDone = snap.docs.filter((d) => d.data()[SOURCES.completedField] === true).length;
    activities = activitiesTotal > 0 ? percent(activitiesDone, ACTIVITY_TARGET) : null;
    got.activities = true; emit();
  }, (e) => onError?.(e));

  const u5 = onSnapshot(doc(db, "users", uid, "obliqo", "profile"), (snap) => {
    const d = snap.data() as { targetRole?: unknown; skills?: unknown } | undefined;
    obProfile = {
      targetRole: typeof d?.targetRole === "string" && d.targetRole ? d.targetRole : null,
      skillCount: Array.isArray(d?.skills) ? d.skills.length : 0,
    };
    recomputeCareer(); got.obProfile = true; emit();
  }, (e) => onError?.(e));

  const u6 = onSnapshot(doc(db, "users", uid, "obliqo", "details"), (snap) => {
    obDetails = snap.exists() ? cleanDetails(snap.data()) : null;
    recomputeCareer(); got.obDetails = true; emit();
  }, (e) => onError?.(e));

  const u7 = onSnapshot(collection(db, "users", uid, "obliqoJobs"), (snap) => {
    applied = 0; saved = 0;
    snap.forEach((d) => { const st = d.data().status; if (st === "applied") applied++; else if (st === "saved") saved++; });
    recomputeCareer(); got.obJobs = true; emit();
  }, (e) => onError?.(e));

  return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); };
}
