import { Timestamp } from "firebase/firestore";

export type NoteCategory =
  | "Academic"
  | "Personal"
  | "Placement"
  | "Research"
  | "Other";

export interface Note {
  id: string;

  studentId: string;

  title: string;
  content: string;

  category: NoteCategory;

  subjectId?: string;
  subjectName?: string;

  moduleId?: string;
  moduleName?: string;

  fileId?: string;

  tags: string[];

  color: string;

  pinned: boolean;

  archived: boolean;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateNoteData {
  studentId: string;

  title: string;
  content: string;

  category: NoteCategory;

  subjectId?: string;
  subjectName?: string;

  moduleId?: string;
  moduleName?: string;

  fileId?: string;

  tags?: string[];

  color?: string;

  pinned?: boolean;

  archived?: boolean;
}