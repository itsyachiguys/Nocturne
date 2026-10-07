import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    type Unsubscribe,
  } from "firebase/firestore";
  
  import { db } from "@/lib/firebase";
  import type { TopicResult } from "@/lib/quizzes";
  import type { ExamOutput } from "@/types/ai-study";
  
  // Firestore layout:
  //   users/{uid}/mockExams/{examId}      the saved paper (metadata + the full exam)
  //   users/{uid}/examAttempts/{id}       one document per finished attempt
  
  export type MockExam = {
    id: string;
    title: string;
    sourceId: string;
    sourceName: string;
    durationMinutes: number;
    totalMarks: number;
    questionCount: number;
    createdAt: Date | null;
    exam: ExamOutput;
  };
  
  export type ExamAttemptInput = {
    examId: string;
    examTitle: string;
    score: number; // percentage, 0 to 100
    marksAwarded: number;
    totalMarks: number;
    durationSec: number;
    /** correct = marks earned, total = marks available, per topic */
    topicResults: TopicResult[];
  };
  
  export type ExamAttempt = ExamAttemptInput & { id: string; completedAt: Date | null };
  
  /** What the exam screen reports when marking has finished. */
  export type ExamResult = Pick<
    ExamAttemptInput,
    "score" | "marksAwarded" | "totalMarks" | "durationSec" | "topicResults"
  >;
  
  const SNAP = { serverTimestamps: "estimate" } as const;
  
  function toDate(v: unknown): Date | null {
    if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
      return (v as { toDate: () => Date }).toDate();
    }
    return v instanceof Date ? v : null;
  }
  
  const examsCol = (uid: string) => collection(db, "users", uid, "mockExams");
  const attemptsCol = (uid: string) => collection(db, "users", uid, "examAttempts");
  
  function mapExam(id: string, d: Record<string, unknown>): MockExam {
    const exam = d.exam as ExamOutput;
    return {
      id,
      title: (d.title as string) ?? exam?.title ?? "Mock exam",
      sourceId: (d.sourceId as string) ?? "",
      sourceName: (d.sourceName as string) ?? "",
      durationMinutes: (d.durationMinutes as number) ?? 0,
      totalMarks: (d.totalMarks as number) ?? 0,
      questionCount: (d.questionCount as number) ?? exam?.questions?.length ?? 0,
      createdAt: toDate(d.createdAt),
      exam,
    };
  }
  
  function mapAttempt(id: string, d: Record<string, unknown>): ExamAttempt {
    return {
      id,
      examId: (d.examId as string) ?? "",
      examTitle: (d.examTitle as string) ?? "Mock exam",
      score: (d.score as number) ?? 0,
      marksAwarded: (d.marksAwarded as number) ?? 0,
      totalMarks: (d.totalMarks as number) ?? 0,
      durationSec: (d.durationSec as number) ?? 0,
      topicResults: (d.topicResults as TopicResult[]) ?? [],
      completedAt: toDate(d.completedAt),
    };
  }
  
  export async function createMockExam(
    uid: string,
    input: { sourceId: string; sourceName: string; exam: ExamOutput }
  ): Promise<string> {
    // examId is only a link back to this document; Firestore also rejects `undefined` values.
    const { examId: _ignored, ...paper } = input.exam;
    void _ignored;
    const clean = JSON.parse(JSON.stringify(paper)) as ExamOutput;
  
    const ref = await addDoc(examsCol(uid), {
      title: clean.title,
      sourceId: input.sourceId,
      sourceName: input.sourceName,
      durationMinutes: clean.durationMinutes,
      totalMarks: clean.totalMarks,
      questionCount: clean.questions.length,
      exam: clean,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }
  
  export function subscribeMockExams(
    uid: string,
    cb: (exams: MockExam[]) => void,
    onError?: (e: Error) => void
  ): Unsubscribe {
    const q = query(examsCol(uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => cb(snap.docs.map((d) => mapExam(d.id, d.data(SNAP)))), onError);
  }
  
  export async function getMockExam(uid: string, examId: string): Promise<MockExam | null> {
    const snap = await getDoc(doc(db, "users", uid, "mockExams", examId));
    return snap.exists() ? mapExam(snap.id, snap.data(SNAP)) : null;
  }
  
  export async function deleteMockExam(uid: string, examId: string): Promise<void> {
    await deleteDoc(doc(db, "users", uid, "mockExams", examId));
  }
  
  export async function saveExamAttempt(uid: string, input: ExamAttemptInput): Promise<void> {
    await addDoc(attemptsCol(uid), { ...input, completedAt: serverTimestamp() });
  }
  
  export function subscribeExamAttempts(
    uid: string,
    cb: (attempts: ExamAttempt[]) => void,
    onError?: (e: Error) => void
  ): Unsubscribe {
    const q = query(attemptsCol(uid), orderBy("completedAt", "desc"), limit(50));
    return onSnapshot(q, (snap) => cb(snap.docs.map((d) => mapAttempt(d.id, d.data(SNAP)))), onError);
  }