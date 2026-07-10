export interface NoteItem {
  id: string;
  title: string;
  subject: string;
  updated: string;
  pinned?: boolean;
}

export const NOTES: NoteItem[] = [
  { id: "n1", title: "Binary trees & traversals", subject: "DSA", updated: "2 hours ago", pinned: true },
  { id: "n2", title: "Normalization — 1NF to BCNF", subject: "DBMS", updated: "Yesterday" },
  { id: "n3", title: "Process scheduling algorithms", subject: "OS", updated: "2 days ago" },
  { id: "n4", title: "TCP handshake & congestion control", subject: "Networks", updated: "3 days ago" },
  { id: "n5", title: "First law of thermodynamics", subject: "Thermodynamics", updated: "5 days ago" },
];

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  cardCount: number;
  mastery: number;
}

export const FLASHCARD_DECKS: FlashcardDeck[] = [
  { id: "d1", title: "Graph algorithms", subject: "DSA", cardCount: 32, mastery: 78 },
  { id: "d2", title: "SQL joins & keys", subject: "DBMS", cardCount: 24, mastery: 64 },
  { id: "d3", title: "Deadlock conditions", subject: "OS", cardCount: 18, mastery: 40 },
  { id: "d4", title: "OSI model layers", subject: "Networks", cardCount: 14, mastery: 90 },
];

export interface QuizHistoryItem {
  id: string;
  title: string;
  subject: string;
  score: number;
  date: string;
}

export const QUIZ_HISTORY: QuizHistoryItem[] = [
  { id: "q1", title: "Sorting algorithms mixed set", subject: "DSA", score: 86, date: "Jul 8" },
  { id: "q2", title: "Normalization practice", subject: "DBMS", score: 72, date: "Jul 6" },
  { id: "q3", title: "CPU scheduling quiz", subject: "OS", score: 64, date: "Jul 3" },
];

export const WEAK_TOPICS = ["Deadlock avoidance", "BCNF decomposition", "TCP congestion control"];

export interface MockExam {
  id: string;
  title: string;
  subject: string;
  questions: number;
  duration: string;
  status: "not-started" | "in-progress" | "completed";
  score?: number;
}

export const MOCK_EXAMS: MockExam[] = [
  { id: "m1", title: "DSA — Full syllabus mock", subject: "DSA", questions: 50, duration: "90 min", status: "completed", score: 82 },
  { id: "m2", title: "DBMS — Unit 1 to 3", subject: "DBMS", questions: 30, duration: "45 min", status: "in-progress" },
  { id: "m3", title: "OS — Process management", subject: "OS", questions: 25, duration: "40 min", status: "not-started" },
];

export interface StudyFile {
  id: string;
  name: string;
  subject: string;
  type: "pdf" | "slides" | "notes";
  size: string;
  uploaded: string;
}

export const STUDY_FILES: StudyFile[] = [
  { id: "f1", name: "DSA Unit 4 — Trees.pdf", subject: "DSA", type: "pdf", size: "3.2 MB", uploaded: "2 days ago" },
  { id: "f2", name: "DBMS Lecture Slides W6.pdf", subject: "DBMS", type: "slides", size: "5.8 MB", uploaded: "4 days ago" },
  { id: "f3", name: "OS Scheduling — handwritten.pdf", subject: "OS", type: "notes", size: "1.4 MB", uploaded: "1 week ago" },
];
