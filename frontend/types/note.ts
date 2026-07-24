import { Timestamp } from "firebase/firestore";

export interface Note {
  id: string;

  moduleId: string;

  title: string;

  content: string;

  tags?: string[];

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateNoteData {
  moduleId: string;

  title: string;

  content: string;

  tags?: string[];
}