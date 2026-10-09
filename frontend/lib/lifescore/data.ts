import { doc, collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ACTIVITY_TARGET, average, percent } from "./calculator";

/**
 * Where each input lives in Firestore (matches the rest of the app):
 *
 *   users/{uid}                       -> { cgpa: 8.2 }
 *   attendance/{id}                   -> { studentId, subjectId, status: "present" | "absent", ... }   (one doc per class)
 *   subjects/{id}                     -> { studentId, name, progress: 0-100, ... }
 *   users/{uid}/activities/{id}       -> { title, type, completed: true | false }
 *
 * Attendance = present records / all records, across all subjects (same sum as the Attendance page).
 * Syllabus   = average of each subject's `progress`.
 * Activities = completed items as a % of ACTIVITY_TARGET.
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
  const got = { user: false, subjects: false, attendance: false, activities: false };
  const emit = () => {
    if (got.user && got.subjects && got.attendance && got.activities) {
      cb({ attendance, syllabus, cgpa, activities, activitiesDone, activitiesTotal, subjects });
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

  return () => { u1(); u2(); u3(); u4(); };
}
