import {
    addDoc,
    collection,
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
    Note,
    CreateNoteData,
  } from "@/types/note";
  
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
  
    async getByModule(moduleId: string): Promise<Note | null> {
      const q = query(
        collection(db, COLLECTION),
        where("moduleId", "==", moduleId)
      );
  
      const snapshot = await getDocs(q);
  
      if (snapshot.empty) {
        return null;
      }
  
      const first = snapshot.docs[0];
  
      return {
        id: first.id,
        ...first.data(),
      } as Note;
    },
  
    async get(noteId: string): Promise<Note | null> {
      const snapshot = await getDoc(doc(db, COLLECTION, noteId));
  
      if (!snapshot.exists()) {
        return null;
      }
  
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as Note;
    },
  
    async update(
      noteId: string,
      content: string
    ): Promise<void> {
      await updateDoc(doc(db, COLLECTION, noteId), {
        content,
        updatedAt: serverTimestamp(),
      });
    },
  };