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
  Module,
  CreateModuleData,
} from "@/types/module";

const COLLECTION = "modules";

export const ModuleService = {
  async create(data: CreateModuleData): Promise<string> {
    try {
      const ref = await addDoc(collection(db, COLLECTION), {
        ...data,

        progress: 0,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return ref.id;
    } catch (error) {
      console.error("Failed to create module:", error);
      throw error;
    }
  },

  async getBySubject(subjectId: string): Promise<Module[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("subjectId", "==", subjectId),
        orderBy("order", "asc")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Module[];
    } catch (error) {
      console.error("Failed to fetch modules:", error);
      throw error;
    }
  },

  async get(moduleId: string): Promise<Module | null> {
    try {
      const snapshot = await getDoc(
        doc(db, COLLECTION, moduleId)
      );

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as Module;
    } catch (error) {
      console.error("Failed to fetch module:", error);
      throw error;
    }
  },

  async update(
    moduleId: string,
    data: Partial<CreateModuleData>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION, moduleId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to update module:", error);
      throw error;
    }
  },

  async delete(moduleId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION, moduleId));
    } catch (error) {
      console.error("Failed to delete module:", error);
      throw error;
    }
  },
};