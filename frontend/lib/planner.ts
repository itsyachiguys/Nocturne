import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    type Unsubscribe,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase"; // same path as in quizzes.ts
  
  /* ------------------------------------------------------------------ */
  /* Types                                                               */
  /* ------------------------------------------------------------------ */
  
  export type Priority = "high" | "medium" | "low";
  
  export type PlannerTask = {
    id: string;
    title: string;
    subjectId: string; // "" = no subject
    due: string; // "YYYY-MM-DD" in local time, "" = no due date
    priority: Priority;
    done: boolean;
    completedAt: Date | null;
    createdAt: Date | null;
  };
  
  export type TaskInput = {
    title: string;
    subjectId: string;
    due: string;
    priority: Priority;
  };
  
  export type FocusSession = {
    id: string;
    taskId: string; // "" = general focus, not tied to a task
    subjectId: string;
    minutes: number;
    completedAt: Date | null;
  };
  
  export type SessionInput = {
    taskId: string;
    subjectId: string;
    minutes: number;
  };
  
  export const DEFAULT_WEEKLY_TARGET = 10;
  
  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  
  // Lets pending serverTimestamp() fields resolve locally instead of being null.
  const SNAP = { serverTimestamps: "estimate" } as const;
  
  function toDate(v: unknown): Date | null {
    if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
      return (v as { toDate: () => Date }).toDate();
    }
    return v instanceof Date ? v : null;
  }
  
  // users/{uid}/plannerTasks/{taskId}
  const tasksCol = (uid: string) => collection(db, "users", uid, "plannerTasks");
  const taskDoc = (uid: string, taskId: string) =>
    doc(db, "users", uid, "plannerTasks", taskId);
  // users/{uid}/focusSessions/{sessionId}
  const sessionsCol = (uid: string) =>
    collection(db, "users", uid, "focusSessions");
  // users/{uid}/planner/settings
  const settingsDoc = (uid: string) => doc(db, "users", uid, "planner", "settings");
  
  function mapTask(id: string, d: Record<string, unknown>): PlannerTask {
    const p = d.priority;
    return {
      id,
      title: (d.title as string) ?? "",
      subjectId: (d.subjectId as string) ?? "",
      due: (d.due as string) ?? "",
      priority: p === "high" || p === "low" ? p : "medium",
      done: (d.done as boolean) ?? false,
      completedAt: toDate(d.completedAt),
      createdAt: toDate(d.createdAt),
    };
  }
  
  function mapSession(id: string, d: Record<string, unknown>): FocusSession {
    return {
      id,
      taskId: (d.taskId as string) ?? "",
      subjectId: (d.subjectId as string) ?? "",
      minutes: (d.minutes as number) ?? 0,
      completedAt: toDate(d.completedAt),
    };
  }
  
  /* ------------------------------------------------------------------ */
  /* Tasks                                                               */
  /* ------------------------------------------------------------------ */
  
  export function subscribeTasks(
    uid: string,
    cb: (tasks: PlannerTask[]) => void,
    onError?: (e: Error) => void
  ): Unsubscribe {
    const q = query(tasksCol(uid), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => mapTask(d.id, d.data(SNAP)))),
      onError
    );
  }
  
  export async function addTask(uid: string, input: TaskInput) {
    await addDoc(tasksCol(uid), {
      ...input,
      done: false,
      completedAt: null,
      createdAt: serverTimestamp(),
    });
  }
  
  export async function updateTask(
    uid: string,
    taskId: string,
    input: TaskInput
  ) {
    await updateDoc(taskDoc(uid, taskId), { ...input });
  }
  
  export async function setTaskDone(uid: string, taskId: string, done: boolean) {
    await updateDoc(taskDoc(uid, taskId), {
      done,
      completedAt: done ? serverTimestamp() : null,
    });
  }
  
  export async function deleteTask(uid: string, taskId: string) {
    await deleteDoc(taskDoc(uid, taskId));
  }
  
  /* ------------------------------------------------------------------ */
  /* Focus sessions (Pomodoro history)                                   */
  /* ------------------------------------------------------------------ */
  
  export async function addFocusSession(uid: string, input: SessionInput) {
    await addDoc(sessionsCol(uid), {
      ...input,
      completedAt: serverTimestamp(),
    });
  }
  
  export function subscribeFocusSessions(
    uid: string,
    cb: (sessions: FocusSession[]) => void,
    onError?: (e: Error) => void
  ): Unsubscribe {
    const q = query(sessionsCol(uid), orderBy("completedAt", "desc"), limit(500));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => mapSession(d.id, d.data(SNAP)))),
      onError
    );
  }
  
  /* ------------------------------------------------------------------ */
  /* Weekly goal                                                         */
  /* ------------------------------------------------------------------ */
  
  export function subscribeWeeklyTarget(
    uid: string,
    cb: (target: number) => void,
    onError?: (e: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      settingsDoc(uid),
      (snap) => {
        const t = snap.data()?.weeklyTarget;
        cb(typeof t === "number" && t > 0 ? t : DEFAULT_WEEKLY_TARGET);
      },
      onError
    );
  }
  
  export async function setWeeklyTarget(uid: string, target: number) {
    await setDoc(settingsDoc(uid), { weeklyTarget: target }, { merge: true });
  }