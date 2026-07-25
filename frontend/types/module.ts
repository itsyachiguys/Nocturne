import { Timestamp } from "firebase/firestore";

export interface Module {
  id: string;

  studentId: string;
  subjectId: string;

  name: string;
  description?: string;

  order: number;
  progress: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateModuleData {
  studentId: string;
  subjectId: string;

  name: string;
  description?: string;

  order: number;
}