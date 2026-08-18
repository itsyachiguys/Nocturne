export type FlashcardDifficulty =
  | "new"
  | "again"
  | "hard"
  | "good"
  | "easy";

export interface FlashcardDeck {
  id: string;
  studentId: string;

  title: string;
  description: string;

  subjectId?: string;
  moduleId?: string;

  color?: string;
  icon?: string;

  cardCount: number;

  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Flashcard {
  id: string;
  deckId: string;
  studentId: string;

  question: string;
  answer: string;

  hint?: string;
  tags?: string[];

  difficulty: FlashcardDifficulty;

  correctCount: number;
  incorrectCount: number;

  lastReviewedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CreateFlashcardDeckData {
  studentId: string;

  title: string;
  description: string;

  subjectId?: string;
  moduleId?: string;

  color?: string;
  icon?: string;
}

export interface UpdateFlashcardDeckData {
  title?: string;
  description?: string;

  subjectId?: string;
  moduleId?: string;

  color?: string;
  icon?: string;
}

export interface CreateFlashcardData {
  deckId: string;
  studentId: string;

  question: string;
  answer: string;

  hint?: string;
  tags?: string[];

  difficulty?: FlashcardDifficulty;
}

export interface UpdateFlashcardData {
  question?: string;
  answer?: string;

  hint?: string;
  tags?: string[];

  difficulty?: FlashcardDifficulty;
}