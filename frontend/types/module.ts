import { Timestamp } from "firebase/firestore";

export interface Module {
  id: string;

  subjectId: string;

  name: string;

  description?: string;

  order: number;

  progress: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateModuleData {
  subjectId: string;

  name: string;

  description?: string;

  order: number;
}