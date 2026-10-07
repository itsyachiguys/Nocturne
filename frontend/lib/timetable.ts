import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
    type Unsubscribe,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase"; // same path as in quizzes.ts / planner.ts
  
  export type TimetableEntry = {
    id: string;
    day: string; // same values as WEEK_DAYS in academic-data
    time: string; // start time, e.g. "09:00" (older entries may be "9:00")
    endTime: string; // end time, e.g. "10:30"; "" on older entries (treated as 1 hour)
    subjectId: string; // id from SUBJECTS in academic-data
    room: string;
  };
  
  export type EntryInput = Omit<TimetableEntry, "id">;
  
  // users/{uid}/timetable/{entryId}
  const entriesCol = (uid: string) => collection(db, "users", uid, "timetable");
  const entryDoc = (uid: string, id: string) =>
    doc(db, "users", uid, "timetable", id);
  
  export function subscribeTimetable(
    uid: string,
    cb: (entries: TimetableEntry[]) => void,
    onError?: (e: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      entriesCol(uid),
      (snap) =>
        cb(
          snap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              day: (x.day as string) ?? "",
              time: (x.time as string) ?? "",
              endTime: (x.endTime as string) ?? "",
              subjectId: (x.subjectId as string) ?? "",
              room: (x.room as string) ?? "",
            };
          })
        ),
      onError
    );
  }
  
  export async function addEntry(uid: string, input: EntryInput) {
    await addDoc(entriesCol(uid), { ...input });
  }
  
  export async function updateEntry(uid: string, id: string, input: EntryInput) {
    await updateDoc(entryDoc(uid, id), { ...input });
  }
  
  export async function deleteEntry(uid: string, id: string) {
    await deleteDoc(entryDoc(uid, id));
  }