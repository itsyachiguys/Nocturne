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
  import { CreateUnitData, Unit } from "@/types/unit";
  
  const COLLECTION = "units";
  
  export const UnitService = {
    async create(data: CreateUnitData) {
      const ref = await addDoc(
        collection(db, COLLECTION),
        {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
  
      return ref.id;
    },
  
    async getAll(subjectId: string) {
      const q = query(
        collection(db, COLLECTION),
        where("subjectId", "==", subjectId)
      );
  
      const snapshot = await getDocs(q);
  
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Unit[];
    },
  
    async get(unitId: string) {
      const snapshot = await getDoc(
        doc(db, COLLECTION, unitId)
      );
  
      if (!snapshot.exists()) {
        return null;
      }
  
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as Unit;
    },
  
    async update(
      unitId: string,
      data: Partial<CreateUnitData>
    ) {
      await updateDoc(
        doc(db, COLLECTION, unitId),
        {
          ...data,
          updatedAt: serverTimestamp(),
        }
      );
    },
  
    async delete(unitId: string) {
      await deleteDoc(
        doc(db, COLLECTION, unitId)
      );
    },
  };