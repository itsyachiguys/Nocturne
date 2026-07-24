import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  Subject,
  CreateSubjectData,
} from "@/types/subject";

const COLLECTION = "subjects";

export const SubjectService = {
  async create(data: CreateSubjectData) {
    const ref = await addDoc(
      collection(db, COLLECTION),
      {
        ...data,

        // Default values
        progress: 0,
        attendance: 0,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    return ref.id;
  },

  async getAll(studentId: string) {
    const q = query(
      collection(db, COLLECTION),
      where("studentId", "==", studentId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Subject[];
  },

  async get(subjectId: string) {
    const snapshot = await getDoc(
      doc(db, COLLECTION, subjectId)
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Subject;
  },

  async update(
    subjectId: string,
    data: Partial<CreateSubjectData>
  ) {
    await updateDoc(
      doc(db, COLLECTION, subjectId),
      {
        ...data,
        updatedAt: serverTimestamp(),
      }
    );
  },

  async delete(subjectId: string) {
    await deleteDoc(
      doc(db, COLLECTION, subjectId)
    );
  },
};