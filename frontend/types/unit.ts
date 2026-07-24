import { Timestamp } from "firebase/firestore";

export interface Unit {
  id: string;

  subjectId: string;

  studentId: string;

  title: string;

  description: string;

  progress: number;

  color: string;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}

export interface CreateUnitData {
  subjectId: string;

  studentId: string;

  title: string;

  description: string;

  progress: number;

  color: string;
}