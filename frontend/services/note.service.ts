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
  orderBy,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Note,
  CreateNoteData,
} from "@/types/note";

const COLLECTION = "notes";

export const NoteService = {
  async create(data: CreateNoteData): Promise<string> {
    try {
      const ref = await addDoc(collection(db, COLLECTION), {
        ...data,

        tags: data.tags ?? [],
        color: data.color ?? "#7C3AED",
        pinned: data.pinned ?? false,
        archived: data.archived ?? false,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return ref.id;
    } catch (error) {
      console.error("Failed to create note:", error);
      throw error;
    }
  },

  async get(noteId: string): Promise<Note | null> {
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
      console.error("Failed to fetch note:", error);
      throw error;
    }
  },

  async getByStudent(studentId: string): Promise<Note[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("studentId", "==", studentId),
        orderBy("updatedAt", "desc")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      throw error;
    }
  },

  async getBySubject(subjectId: string): Promise<Note[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("subjectId", "==", subjectId),
        orderBy("updatedAt", "desc")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
    } catch (error) {
      console.error("Failed to fetch subject notes:", error);
      throw error;
    }
  },

  async getByModule(moduleId: string): Promise<Note[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("moduleId", "==", moduleId),
        orderBy("updatedAt", "desc")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
    } catch (error) {
      console.error("Failed to fetch module notes:", error);
      throw error;
    }
  },

  async update(
    noteId: string,
    data: Partial<CreateNoteData>
  ): Promise<void> {
    try {
      await updateDoc(
        doc(db, COLLECTION, noteId),
        {
          ...data,
          updatedAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error("Failed to update note:", error);
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
      console.error("Failed to pin note:", error);
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
      console.error("Failed to archive note:", error);
      throw error;
    }
  },

  async delete(noteId: string): Promise<void> {
    try {
      await deleteDoc(
        doc(db, COLLECTION, noteId)
      );
    } catch (error) {
      console.error("Failed to delete note:", error);
      throw error;
    }
  },
};