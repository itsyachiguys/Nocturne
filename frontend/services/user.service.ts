import {
    doc,
    getDoc,
    updateDoc,
    DocumentData,
    serverTimestamp,
  } from "firebase/firestore";
  
  import { db } from "@/lib/firebase";
  
  export interface OnboardingData {
    university: string;
    degree: string;
    branch: string;
    semester: number;
    graduationYear: number;
  }
  
  export const UserService = {
    async getProfile(uid: string) {
      const docRef = doc(db, "users", uid);
  
      const snapshot = await getDoc(docRef);
  
      if (!snapshot.exists()) {
        return null;
      }
  
      return snapshot.data();
    },
  
    async updateProfile(
      uid: string,
      data: Partial<DocumentData>
    ) {
      const docRef = doc(db, "users", uid);
  
      await updateDoc(docRef, data);
    },
  
    async completeOnboarding(
      uid: string,
      data: OnboardingData
    ) {
      const docRef = doc(db, "users", uid);
  
      await updateDoc(docRef, {
        ...data,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      });
    },
  };