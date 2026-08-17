import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    where,
  } from "firebase/firestore";
  
  import { db } from "@/lib/firebase";
  
  import { UploadedFile } from "@/types/uploaded-file";
  
  const COLLECTION = "uploaded_files";
  
  export interface CreateUploadedFileData {
    unitId: string;
    studentId: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
  }
  
  export const UploadedFileService = {
    async create(
      data: CreateUploadedFileData
    ): Promise<string> {
      try {
        const ref = await addDoc(
          collection(db, COLLECTION),
          {
            unitId: data.unitId,
            studentId: data.studentId,
            fileName: data.fileName,
            fileType: data.fileType,
            fileUrl: data.fileUrl,
            createdAt: serverTimestamp(),
          }
        );
  
        return ref.id;
      } catch (error) {
        console.error(
          "Failed to create uploaded file:",
          error
        );
  
        throw error;
      }
    },
  
    async getByUnit(
      unitId: string
    ): Promise<UploadedFile[]> {
      try {
        const q = query(
          collection(db, COLLECTION),
          where("unitId", "==", unitId)
        );
  
        const snapshot = await getDocs(q);
  
        return snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as UploadedFile[];
      } catch (error) {
        console.error(
          "Failed to fetch uploaded files:",
          error
        );
  
        throw error;
      }
    },
  
    async getByStudent(
      studentId: string
    ): Promise<UploadedFile[]> {
      try {
        const q = query(
          collection(db, COLLECTION),
          where(
            "studentId",
            "==",
            studentId
          )
        );
  
        const snapshot = await getDocs(q);
  
        return snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as UploadedFile[];
      } catch (error) {
        console.error(
          "Failed to fetch uploaded files:",
          error
        );
  
        throw error;
      }
    },
  
    async delete(
      fileId: string
    ): Promise<void> {
      try {
        await deleteDoc(
          doc(
            db,
            COLLECTION,
            fileId
          )
        );
      } catch (error) {
        console.error(
          "Failed to delete uploaded file:",
          error
        );
  
        throw error;
      }
    },
  };