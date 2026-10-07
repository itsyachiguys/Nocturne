import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // TODO: adjust to your actual firebase init path

/* ------------------------------------------------------------------ */
/* Types (reconstructed from usage; adjust field names if needed)      */
/* ------------------------------------------------------------------ */

export type Difficulty = "Easy" | "Medium" | "Hard";

export type Quiz = {
  id: string;
  title: string;
  subjectId: string;
  difficulty: Difficulty;
  timerMinutes: number; // 0 = no timer
  questionCount: number;
  createdAt: Date | null;
};

export type QuizInput = {
  title: string;
  subjectId: string;
  difficulty: Difficulty;
  timerMinutes: number;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
};

export type QuestionInput = Omit<QuizQuestion, "id">;

export type TopicResult = {
  topic: string;
  correct: number;
  total: number;
};

export type QuizAttempt = {
  id: string;
  quizId: string;
  quizTitle: string;
  subjectId: string;
  score: number;
  correctCount: number;
  totalCount: number;
  durationSec: number;
  topicResults: TopicResult[];
  completedAt: Date | null;
};

export type AttemptInput = Omit<QuizAttempt, "id" | "completedAt">;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Lets pending serverTimestamp() fields resolve locally instead of being null.
const SNAP = { serverTimestamps: "estimate" } as const;

function toDate(v: unknown): Date | null {
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate();
  }
  return v instanceof Date ? v : null;
}

const quizzesCol = (uid: string) => collection(db, "users", uid, "quizzes");
const quizDoc = (uid: string, quizId: string) =>
  doc(db, "users", uid, "quizzes", quizId);
const questionsCol = (uid: string, quizId: string) =>
  collection(db, "users", uid, "quizzes", quizId, "questions");
const attemptsCol = (uid: string) => collection(db, "users", uid, "attempts");

function mapQuiz(id: string, d: Record<string, unknown>): Quiz {
  return {
    id,
    title: (d.title as string) ?? "",
    subjectId: (d.subjectId as string) ?? "",
    difficulty: ((d.difficulty as Difficulty) ?? "Easy"),
    timerMinutes: (d.timerMinutes as number) ?? 0,
    questionCount: (d.questionCount as number) ?? 0,
    createdAt: toDate(d.createdAt),
  };
}

function mapQuestion(id: string, d: Record<string, unknown>): QuizQuestion {
  return {
    id,
    prompt: (d.prompt as string) ?? "",
    options: (d.options as string[]) ?? [],
    correctIndex: (d.correctIndex as number) ?? 0,
    explanation: (d.explanation as string) ?? "",
    topic: (d.topic as string) ?? "",
  };
}

function mapAttempt(id: string, d: Record<string, unknown>): QuizAttempt {
  return {
    id,
    quizId: (d.quizId as string) ?? "",
    quizTitle: (d.quizTitle as string) ?? "Quiz",
    subjectId: (d.subjectId as string) ?? "",
    score: (d.score as number) ?? 0,
    correctCount: (d.correctCount as number) ?? 0,
    totalCount: (d.totalCount as number) ?? 0,
    durationSec: (d.durationSec as number) ?? 0,
    topicResults: (d.topicResults as TopicResult[]) ?? [],
    completedAt: toDate(d.completedAt),
  };
}

/* ------------------------------------------------------------------ */
/* Quizzes                                                             */
/* ------------------------------------------------------------------ */

export async function createQuiz(uid: string, input: QuizInput) {
  const ref = await addDoc(quizzesCol(uid), {
    ...input,
    questionCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeQuizzes(
  uid: string,
  cb: (quizzes: Quiz[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  const q = query(quizzesCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => mapQuiz(d.id, d.data(SNAP)))),
    onError
  );
}

export async function getQuiz(uid: string, quizId: string) {
  const snap = await getDoc(quizDoc(uid, quizId));
  return snap.exists() ? mapQuiz(snap.id, snap.data(SNAP)) : null;
}

export async function deleteQuiz(uid: string, quizId: string) {
  const qs = await getDocs(questionsCol(uid, quizId));
  // A batch holds up to 500 writes; chunk to stay safe for large quizzes.
  const refs = [...qs.docs.map((d) => d.ref), quizDoc(uid, quizId)];
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

/* ------------------------------------------------------------------ */
/* Subjects (NEW) - feeds the subject dropdown in the create-quiz form */
/* NOTE: if your Subjects page already has a subscribe helper, import  */
/* that instead and delete this block. Path assumes users/{uid}/subjects */
/* ------------------------------------------------------------------ */

export type Subject = { id: string; name: string };

export function subscribeSubjects(
  uid: string,
  cb: (subjects: Subject[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  const q = query(collection(db, "users", uid, "subjects"), orderBy("name"));
  return onSnapshot(
    q,
    (snap) =>
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().name as string) ?? "",
        }))
      ),
    onError
  );
}

/* ------------------------------------------------------------------ */
/* Questions                                                           */
/* ------------------------------------------------------------------ */

export function subscribeQuestions(
  uid: string,
  quizId: string,
  cb: (questions: QuizQuestion[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  const q = query(questionsCol(uid, quizId), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => mapQuestion(d.id, d.data(SNAP)))),
    onError
  );
}

export async function getQuestions(uid: string, quizId: string) {
  const snap = await getDocs(
    query(questionsCol(uid, quizId), orderBy("createdAt", "asc"))
  );
  return snap.docs.map((d) => mapQuestion(d.id, d.data(SNAP)));
}

export async function addQuestion(
  uid: string,
  quizId: string,
  input: QuestionInput
) {
  const batch = writeBatch(db);
  batch.set(doc(questionsCol(uid, quizId)), {
    ...input,
    createdAt: serverTimestamp(),
  });
  batch.update(quizDoc(uid, quizId), { questionCount: increment(1) });
  await batch.commit();
}

export async function updateQuestion(
  uid: string,
  quizId: string,
  questionId: string,
  input: QuestionInput
) {
  await updateDoc(doc(questionsCol(uid, quizId), questionId), { ...input });
}

export async function deleteQuestion(
  uid: string,
  quizId: string,
  questionId: string
) {
  const batch = writeBatch(db);
  batch.delete(doc(questionsCol(uid, quizId), questionId));
  batch.update(quizDoc(uid, quizId), { questionCount: increment(-1) });
  await batch.commit();
}

/* ------------------------------------------------------------------ */
/* Attempts                                                            */
/* ------------------------------------------------------------------ */

export async function saveAttempt(uid: string, input: AttemptInput) {
  await addDoc(attemptsCol(uid), {
    ...input,
    completedAt: serverTimestamp(),
  });
}

export function subscribeAttempts(
  uid: string,
  cb: (attempts: QuizAttempt[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  const q = query(attemptsCol(uid), orderBy("completedAt", "desc"), limit(50));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => mapAttempt(d.id, d.data(SNAP)))),
    onError
  );
}

/**
 * Topics with under 60% accuracy across the most recent attempts
 * (needs at least 2 answered questions on the topic). Worst first.
 * Questions with no topic are grouped as "General" and ignored here.
 */
export function computeWeakTopics(attempts: QuizAttempt[], recent = 10) {
  const totals = new Map<string, { correct: number; total: number }>();
  for (const a of attempts.slice(0, recent)) {
    for (const r of a.topicResults) {
      if (r.topic === "General") continue;
      const t = totals.get(r.topic) ?? { correct: 0, total: 0 };
      t.correct += r.correct;
      t.total += r.total;
      totals.set(r.topic, t);
    }
  }
  return [...totals.entries()]
    .filter(([, t]) => t.total >= 2 && t.correct / t.total < 0.6)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .map(([topic]) => topic);
}