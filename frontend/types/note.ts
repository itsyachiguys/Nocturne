import { Timestamp } from "firebase/firestore";

export interface Note {
  id: string;

  studentId: string;

  subjectId: string;

  moduleId: string;

  title: string;

  content: string;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateNoteData {
  studentId: string;

  subjectId: string;

  moduleId: string;

  title: string;

  content: string;
}