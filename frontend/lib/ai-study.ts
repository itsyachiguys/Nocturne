export type AiOutputType = "summary" | "flashcards" | "quiz";

/** pdf = sent to the model as a document, text = .txt / .md read as plain text */
export type AiSourceKind = "pdf" | "text";

export interface SummaryOutput {
  title: string;
  overview: string;
  keyPoints: string[];
  sections: { heading: string; points: string[] }[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardsOutput {
  title: string;
  cards: Flashcard[];
}

export interface QuizQuestion {
  question: string;
  options: string[]; // always 4
  answerIndex: number; // 0-3
  explanation: string;
  topic: string; // feeds "Needs revision" later
}

export interface QuizOutput {
  title: string;
  questions: QuizQuestion[];
}

export interface AiOutputByType {
  summary: SummaryOutput;
  flashcards: FlashcardsOutput;
  quiz: QuizOutput;
}

export type AiOutputMap = Partial<AiOutputByType>;

/** A file the student uploaded (stored in Cloudinary, metadata in Firestore). */
export interface AiSource {
  id: string;
  name: string;
  url: string;
  kind: AiSourceKind;
  bytes: number;
  createdAt: Date | null;
}