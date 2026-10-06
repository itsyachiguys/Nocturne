export interface CreateSubjectData {
  studentId: string;
  name: string;
  code: string;
  semester: number;
  credits: number;
  faculty: string;
  color: string;
}

export interface Subject extends CreateSubjectData {
  id: string;

  progress?: number;
  attendance?: number;

  createdAt?: any;
  updatedAt?: any;
}

export type Subject = { id: string; name: string };

export function subscribeSubjects(
  uid: string,
  cb: (subjects: Subject[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  const q = query(collection(db, "users", uid, "subjects"), orderBy("name"));
  return onSnapshot(
    q,
    (snap) =>
      cb(snap.docs.map((d) => ({ id: d.id, name: (d.data().name as string) ?? "" }))),
    onError
  );
}