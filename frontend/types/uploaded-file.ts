import { Timestamp } from "firebase/firestore";

export interface UploadedFile {
  id: string;

  unitId: string;

  studentId: string;

  fileName: string;

  fileType: string;

  fileUrl: string;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateUploadedFileData {
  unitId: string;

  studentId: string;

  fileName: string;

  fileType: string;

  fileUrl: string;
}