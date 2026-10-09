import {
  addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ActivityType = "course" | "extracurricular" | "certification" | "other";

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "course", label: "Course" },
  { value: "extracurricular", label: "Extracurricular" },
  { value: "certification", label: "Certification" },
  { value: "other", label: "Other" },
];

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  completed: boolean;
  createdAt: Date | null;
}

const col = (uid: string) => collection(db, "users", uid, "activities");

export function subscribeActivities(uid: string, cb: (a: Activity[]) => void, onError?: (e: Error) => void) {
  return onSnapshot(col(uid), (snap) => {
    const list = snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        title: String(x.title ?? ""),
        type: (x.type as ActivityType) ?? "other",
        completed: x.completed === true,
        createdAt: x.createdAt?.toDate?.() ?? null,
      } as Activity;
    });
    // Newest first; items still waiting on the server timestamp count as newest.
    list.sort((a, b) => (b.createdAt?.getTime() ?? Infinity) - (a.createdAt?.getTime() ?? Infinity));
    cb(list);
  }, (e) => onError?.(e));
}

export const addActivity = (uid: string, title: string, type: ActivityType, completed: boolean) =>
  addDoc(col(uid), { title: title.trim(), type, completed, createdAt: serverTimestamp() });

export const setActivityCompleted = (uid: string, id: string, completed: boolean) =>
  updateDoc(doc(db, "users", uid, "activities", id), { completed });

export const removeActivity = (uid: string, id: string) =>
  deleteDoc(doc(db, "users", uid, "activities", id));
