import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  CreateNoteData,
  Note,
} from "@/types/note";

const COLLECTION = "notes";

function removeUndefined(
  data: Record<string, unknown>
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

export const NoteService = {
  async create(
    data: CreateNoteData
  ): Promise<string> {
    try {
      const noteData = removeUndefined({
        studentId: data.studentId,
        title: data.title,
        content: data.content,
        category: data.category,

        subjectId: data.subjectId,
        subjectName: data.subjectName,

        moduleId: data.moduleId,
        moduleName: data.moduleName,

        fileId: data.fileId,

        tags: data.tags ?? [],
        color: data.color ?? "#7C3AED",
        pinned: data.pinned ?? false,
        archived: data.archived ?? false,
      });

      console.log(
        "Final Firestore note data:",
        noteData
      );

      const ref = await addDoc(
        collection(db, COLLECTION),
        {
          ...noteData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      return ref.id;
    } catch (error) {
      console.error(
        "Failed to create note:",
        error
      );

      throw error;
    }
  },

  async get(
    noteId: string
  ): Promise<Note | null> {
    try {
      const snapshot = await getDoc(
        doc(db, COLLECTION, noteId)
      );

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as Note;
    } catch (error) {
      console.error(
        "Failed to fetch note:",
        error
      );

      throw error;
    }
  },

  async getByStudent(
    studentId: string
  ): Promise<Note[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("studentId", "==", studentId),
        orderBy("updatedAt", "desc")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Note[];
    } catch (error) {
      console.error(
        "Failed to fetch notes:",
        error
      );

      throw error;
    }
  },

  async getBySubject(
    subjectId: string
  ): Promise<Note[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("subjectId", "==", subjectId),
        orderBy("updatedAt", "desc")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Note[];
    } catch (error) {
      console.error(
        "Failed to fetch subject notes:",
        error
      );

      throw error;
    }
  },

  async getByModule(
    moduleId: string
  ): Promise<Note[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("moduleId", "==", moduleId),
        orderBy("updatedAt", "desc")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Note[];
    } catch (error) {
      console.error(
        "Failed to fetch module notes:",
        error
      );

      throw error;
    }
  },

  async update(
    noteId: string,
    data: Partial<CreateNoteData>
  ): Promise<void> {
    try {
      const cleanedData = removeUndefined({
        ...data,
      });

      await updateDoc(
        doc(db, COLLECTION, noteId),
        {
          ...cleanedData,
          updatedAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Failed to update note:",
        error
      );

      throw error;
    }
  },

  async pin(
    noteId: string,
    pinned: boolean
  ): Promise<void> {
    try {
      await updateDoc(
        doc(db, COLLECTION, noteId),
        {
          pinned,
          updatedAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Failed to pin note:",
        error
      );

      throw error;
    }
  },

  async archive(
    noteId: string,
    archived: boolean
  ): Promise<void> {
    try {
      await updateDoc(
        doc(db, COLLECTION, noteId),
        {
          archived,
          updatedAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Failed to archive note:",
        error
      );

      throw error;
    }
  },

  async delete(
    noteId: string
  ): Promise<void> {
    try {
      await deleteDoc(
        doc(db, COLLECTION, noteId)
      );
    } catch (error) {
      console.error(
        "Failed to delete note:",
        error
      );

      throw error;
    }
  },
};