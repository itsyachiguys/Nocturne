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
  import { Note, CreateNoteData } from "@/types/note";
  
  const COLLECTION = "notes";
  
  export const NoteService = {
    async create(data: CreateNoteData): Promise<string> {
      const ref = await addDoc(collection(db, COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  
      return ref.id;
    },
  
    async getByModule(moduleId: string): Promise<Note[]> {
      const q = query(
        collection(db, COLLECTION),
        where("moduleId", "==", moduleId),
        orderBy("createdAt", "desc")
      );
  
      const snapshot = await getDocs(q);
  
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
    },
  
    async get(noteId: string): Promise<Note | null> {
      const snapshot = await getDoc(doc(db, COLLECTION, noteId));
  
      if (!snapshot.exists()) return null;
  
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as Note;
    },
  
    async update(
      noteId: string,
      data: Partial<CreateNoteData>
    ): Promise<void> {
      await updateDoc(doc(db, COLLECTION, noteId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
  
    async delete(noteId: string): Promise<void> {
      await deleteDoc(doc(db, COLLECTION, noteId));
    },
  };