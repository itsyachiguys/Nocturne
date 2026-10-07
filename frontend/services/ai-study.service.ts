import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { addQuestion, createQuiz, deleteQuiz } from "@/lib/quizzes";
import { createMockExam, deleteMockExam } from "@/lib/mock-exams";
import type {
  AiOutputByType,
  AiOutputMap,
  AiOutputType,
  AiSource,
  AiSourceKind,
  ExamGrade,
  ExamGradeItem,
  ExamOutput,
  QuizOutput,
} from "@/types/ai-study";

export const MAX_UPLOAD_BYTES = 14 * 1024 * 1024;

const OUTPUT_TYPES: AiOutputType[] = ["summary", "flashcards", "quiz", "exam"];

// Firestore layout:
//   users/{uid}/aiSources/{sourceId}                 file metadata
//   users/{uid}/aiSources/{sourceId}/outputs/{type}  { data } for summary | flashcards | quiz | exam
const sourcesCol = (uid: string) => collection(db, "users", uid, "aiSources");

/** Best-effort delete of a saved mock exam; never blocks the caller. */
async function deleteLinkedExam(uid: string, examId: string): Promise<void> {
  try {
    await deleteMockExam(uid, examId);
  } catch (e) {
    console.error("delete linked exam", e);
  }
}

/** Best-effort delete of a quiz on the Quizzes page; never blocks the caller. */
async function deleteLinkedQuiz(uid: string, quizId: string): Promise<void> {
  try {
    await deleteQuiz(uid, quizId);
  } catch (e) {
    console.error("delete linked quiz", e);
  }
}

export const AiStudyService = {
  /** Ask the server to generate one output for a file. */
  async generate<T extends AiOutputType>(
    type: T,
    source: Pick<AiSource, "url" | "kind">
  ): Promise<AiOutputByType[T]> {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in again.");

    const token = await user.getIdToken();
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, fileUrl: source.url, kind: source.kind }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      if (json?.error) throw new Error(json.error);
      // Not our JSON error: usually a hosting timeout (504) or a missing route (404).
      console.error("ai/generate failed", res.status, res.statusText);
      throw new Error(
        res.status === 504 || res.status === 408
          ? "The server timed out before the AI finished. Try again or use a smaller file."
          : `Generation failed (server status ${res.status}). Check the server logs.`
      );
    }
    if (!json?.data) throw new Error("The server returned an empty result.");
    return json.data as AiOutputByType[T];
  },

  /** Ask the server to mark written exam answers against the model answers. */
  async gradeExam(items: ExamGradeItem[]): Promise<ExamGrade[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in again.");

    const token = await user.getIdToken();
    const res = await fetch("/api/ai/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.error ?? `Marking failed (server status ${res.status}). Please try again.`);
    }
    if (!Array.isArray(json?.grades)) throw new Error("The server returned an empty result.");
    return json.grades as ExamGrade[];
  },

  async addSource(
    uid: string,
    input: { name: string; url: string; kind: AiSourceKind; bytes: number; publicId: string }
  ): Promise<string> {
    const ref = await addDoc(sourcesCol(uid), { ...input, createdAt: serverTimestamp() });
    return ref.id;
  },

  async listSources(uid: string): Promise<AiSource[]> {
    const snap = await getDocs(query(sourcesCol(uid), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        name: String(x.name ?? "Untitled"),
        url: String(x.url ?? ""),
        kind: (x.kind === "text" ? "text" : "pdf") as AiSourceKind,
        bytes: Number(x.bytes ?? 0),
        createdAt: (x.createdAt as Timestamp | null)?.toDate?.() ?? null,
      };
    });
  },

  async saveOutput<T extends AiOutputType>(
    uid: string,
    sourceId: string,
    type: T,
    data: AiOutputByType[T]
  ) {
    await setDoc(doc(db, "users", uid, "aiSources", sourceId, "outputs", type), {
      data,
      createdAt: serverTimestamp(),
    });
  },

  async getOutputs(uid: string, sourceId: string): Promise<AiOutputMap> {
    const snap = await getDocs(collection(db, "users", uid, "aiSources", sourceId, "outputs"));
    const out: Record<string, unknown> = {};
    snap.docs.forEach((d) => {
      if ((OUTPUT_TYPES as string[]).includes(d.id)) out[d.id] = d.data().data;
    });
    return out as AiOutputMap;
  },

  /**
   * Mirror an AI-generated quiz onto the Quizzes page (users/{uid}/quizzes) so it can be
   * taken there and its attempts feed the dashboard. Returns the new quiz id.
   */
  async publishQuiz(uid: string, quiz: QuizOutput, subjectId = ""): Promise<string> {
    const quizId = await createQuiz(uid, {
      title: quiz.title,
      subjectId,
      difficulty: "Medium",
      timerMinutes: 0,
    });
    try {
      // Sequential on purpose: questions are ordered by createdAt, so write them in order.
      for (const q of quiz.questions) {
        await addQuestion(uid, quizId, {
          prompt: q.question,
          options: q.options,
          correctIndex: q.answerIndex,
          explanation: q.explanation,
          topic: q.topic,
        });
      }
    } catch (e) {
      await deleteLinkedQuiz(uid, quizId); // don't leave a half-written quiz behind
      throw e;
    }
    return quizId;
  },

  /** Save an AI-generated exam to the Mock Exams page. Returns the new exam id. */
  async publishExam(uid: string, sourceId: string, sourceName: string, exam: ExamOutput): Promise<string> {
    return createMockExam(uid, { sourceId, sourceName, exam });
  },

  async unpublishExam(uid: string, examId: string): Promise<void> {
    await deleteLinkedExam(uid, examId);
  },

  async unpublishQuiz(uid: string, quizId: string): Promise<void> {
    await deleteLinkedQuiz(uid, quizId);
  },

  /** Removes the metadata, generated outputs and the linked quiz. (The Cloudinary file itself stays.) */
  async removeSource(uid: string, sourceId: string): Promise<void> {
    // Best effort: a failure here (for example a missing security rule) must not stop the file being removed.
    try {
      const quizSnap = await getDoc(doc(db, "users", uid, "aiSources", sourceId, "outputs", "quiz"));
      const quizId = (quizSnap.data()?.data as { quizId?: string } | undefined)?.quizId;
      if (quizId) await deleteLinkedQuiz(uid, quizId);
    } catch (e) {
      console.error("remove: read linked quiz", e);
    }
    try {
      const examSnap = await getDoc(doc(db, "users", uid, "aiSources", sourceId, "outputs", "exam"));
      const examId = (examSnap.data()?.data as { examId?: string } | undefined)?.examId;
      if (examId) await deleteLinkedExam(uid, examId);
    } catch (e) {
      console.error("remove: read linked exam", e);
    }

    await Promise.all(
      OUTPUT_TYPES.map((t) =>
        deleteDoc(doc(db, "users", uid, "aiSources", sourceId, "outputs", t)).catch((e) =>
          console.error(`remove: delete output ${t}`, e)
        )
      )
    );
    await deleteDoc(doc(db, "users", uid, "aiSources", sourceId));
  },
};