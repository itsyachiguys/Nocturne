export type AiOutputType = "summary" | "flashcards" | "quiz" | "exam";

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
  /** Id of the matching quiz on the Quizzes page (set after the quiz is published there). */
  quizId?: string;
}

export type ExamQuestionType = "mcq" | "short" | "long";

export interface ExamQuestion {
  type: ExamQuestionType;
  question: string;
  marks: number;
  topic: string;
  /** mcq only: always 4 options */
  options?: string[];
  /** mcq only: 0-3 */
  answerIndex?: number;
  /** short / long: the model answer shown after the exam */
  modelAnswer?: string;
  /** short / long: what earns marks, used for self-marking */
  markingPoints?: string[];
}

export interface ExamOutput {
  title: string;
  durationMinutes: number; // 0 = untimed
  totalMarks: number;
  instructions: string[];
  questions: ExamQuestion[];
  /** Id of the matching saved paper on the Mock Exams page (set after it is published there). */
  examId?: string;
}

/** One written answer sent for AI marking. */
export interface ExamGradeItem {
  index: number; // position of the question in the exam
  question: string;
  maxMarks: number;
  modelAnswer: string;
  markingPoints: string[];
  studentAnswer: string;
}

export interface ExamGrade {
  index: number;
  marks: number;
  feedback: string;
}

export interface AiOutputByType {
  summary: SummaryOutput;
  flashcards: FlashcardsOutput;
  quiz: QuizOutput;
  exam: ExamOutput;
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