"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  IconAlertTriangle,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { SUBJECTS } from "@/lib/academic-data";
import {
  computeWeakTopics,
  createQuiz,
  deleteQuiz,
  subscribeAttempts,
  subscribeQuizzes,
  type Difficulty,
  type Quiz,
  type QuizAttempt,
  type Subject,
} from "@/lib/quizzes";

const FIELD =
  "mt-1 w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark";
const LABEL =
  "text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark";
const MUTED = "text-sm text-ink-secondary dark:text-ink-secondary-dark";

function scoreColor(score: number) {
  if (score >= 80) return "text-mint";
  if (score >= 60) return "text-pastel-orange";
  return "text-coral";
}

// Rejects if the promise takes too long (e.g. Firestore is offline and the write hangs).
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

// undefined = auth still loading, null = signed out, string = uid.
// Swap this for your own AuthContext hook if you have one.
function useUid() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  useEffect(
    () => onAuthStateChanged(getAuth(), (u) => setUid(u?.uid ?? null)),
    []
  );
  return uid;
}

export default function QuizzesPage() {
  const router = useRouter();
  const uid = useUid();

  // Same subject list the Subjects section uses.
  const [subjects] = useState<Subject[]>(
    SUBJECTS.map((s) => ({ id: s.id, name: s.name }))
  );
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(SUBJECTS[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [timer, setTimer] = useState("15");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load quizzes and attempts once we know who the user is.
  useEffect(() => {
    if (!uid) return;
    const onErr = (label: string) => (e: Error) => {
      console.error(label, e);
      setLoadError(true);
    };
    const unsubs = [
      subscribeQuizzes(
        uid,
        (list) => {
          setQuizzes(list);
          setLoadError(false);
        },
        onErr("subscribeQuizzes")
      ),
      subscribeAttempts(uid, setAttempts, onErr("subscribeAttempts")),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const subjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name ?? "Unknown subject";

  async function handleCreate() {
    console.log("create clicked", { uid, subjectId, title });
    if (!uid || !subjectId) return;
    const name = title.trim();
    if (!name) {
      setCreateError("Give your quiz a title.");
      return;
    }
    const minutes = Math.max(0, Math.floor(Number(timer) || 0));
    setCreating(true);
    setCreateError(null);
    try {
      const id = await withTimeout(
        createQuiz(uid, {
          title: name,
          subjectId,
          difficulty,
          timerMinutes: minutes,
        }),
        15000
      );
      router.push(`/dashboard/quizzes/${id}`);
    } catch (e) {
      console.error("createQuiz", e);
      setCreateError("Couldn't create the quiz. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(q: Quiz) {
    if (!uid) return;
    if (!window.confirm(`Delete "${q.title}" and all its questions?`)) return;
    try {
      await deleteQuiz(uid, q.id);
    } catch (e) {
      console.error("deleteQuiz", e);
      setLoadError(true);
    }
  }

  const weakTopics = attempts ? computeWeakTopics(attempts) : [];
  const canCreate = !!uid && !!subjectId && !creating;

  return (
    <>
      <PageHeader
        title="Quizzes"
        subtitle="Build your own quizzes, take them, and track your results"
      />

      {loadError && (
        <p className="mb-4 text-sm text-coral">
          Couldn&apos;t load your quizzes. Check your connection and
          permissions.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {/* Create Quiz */}
          <div className="card p-6">
            <h4 className="mb-6 text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
              Create a New Quiz
            </h4>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={LABEL}>Title</span>
                <input
                  name="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures"
                  className={FIELD}
                />
              </label>

              <label className="block">
                <span className={LABEL}>Subject</span>
                <select
                  name="subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  disabled={subjects.length === 0}
                  className={FIELD}
                >
                  {subjects.length === 0 ? (
                    <option value="">No subjects yet</option>
                  ) : (
                    subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="block">
                <span className={LABEL}>Difficulty</span>
                <select
                  name="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className={FIELD}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className={LABEL}>Timer (minutes, 0 for no timer)</span>
                <input
                  name="timer"
                  type="number"
                  min={0}
                  value={timer}
                  onChange={(e) => setTimer(e.target.value)}
                  className={FIELD}
                />
              </label>
            </div>

            {subjects.length === 0 && uid && (
              <p className={`mt-4 ${MUTED}`}>
                Add a subject in the Subjects section first.
              </p>
            )}
            {createError && (
              <p className="mt-4 text-sm text-coral">{createError}</p>
            )}

            <button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate}
              className="btn-primary mt-6 flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <IconSparkles size={18} />
              {creating ? "Creating..." : "Create quiz and add questions"}
            </button>
          </div>

          {/* My Quizzes */}
          <div className="card p-6">
            <h4 className="mb-5 text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
              My Quizzes
            </h4>

            {quizzes === null ? (
              <p className={MUTED}>{loadError ? "Unavailable." : "Loading..."}</p>
            ) : quizzes.length === 0 ? (
              <p className={MUTED}>No quizzes yet. Create your first one above.</p>
            ) : (
              <div className="divide-y divide-line dark:divide-line-dark">
                {quizzes.map((q) => (
                  <div
                    key={q.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div>
                      <p className="font-medium text-ink-primary dark:text-ink-primary-dark">
                        {q.title}
                      </p>
                      <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                        {subjectName(q.subjectId)} • {q.difficulty} •{" "}
                        {q.questionCount} question
                        {q.questionCount === 1 ? "" : "s"} •{" "}
                        {q.timerMinutes > 0 ? `${q.timerMinutes} min` : "No timer"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/quizzes/${q.id}`}
                        className="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold dark:border-line-dark"
                      >
                        Edit
                      </Link>
                      {q.questionCount > 0 ? (
                        <Link
                          href={`/dashboard/quizzes/${q.id}/take`}
                          className="btn-primary px-3 py-1.5 text-xs"
                        >
                          Take
                        </Link>
                      ) : (
                        <span className="px-3 py-1.5 text-xs text-ink-secondary dark:text-ink-secondary-dark">
                          Add questions to take
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(q)}
                        aria-label={`Delete ${q.title}`}
                        className="rounded-xl p-2 text-coral hover:bg-coral/10"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quiz History */}
          <div className="card p-6">
            <h4 className="mb-5 text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
              Quiz History
            </h4>

            {attempts === null ? (
              <p className={MUTED}>{loadError ? "Unavailable." : "Loading..."}</p>
            ) : attempts.length === 0 ? (
              <p className={MUTED}>No attempts yet. Take a quiz to see results here.</p>
            ) : (
              <div className="divide-y divide-line dark:divide-line-dark">
                {attempts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div>
                      <p className="font-medium text-ink-primary dark:text-ink-primary-dark">
                        {a.quizTitle}
                      </p>
                      <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                        {subjectName(a.subjectId)} •{" "}
                        {a.completedAt
                          ? a.completedAt.toLocaleDateString()
                          : "Just now"}{" "}
                        • {a.correctCount}/{a.totalCount} correct
                      </p>
                    </div>
                    <span
                      className={`font-display text-xl font-bold ${scoreColor(
                        a.score
                      )}`}
                    >
                      {Math.round(a.score)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weak Topics */}
        <div className="card h-fit p-6">
          <h4 className="mb-5 flex items-center gap-2 text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
            <IconAlertTriangle size={18} className="text-pastel-orange" />
            Weak Topics
          </h4>

          {weakTopics.length === 0 ? (
            <p className={MUTED}>
              Nothing flagged yet. Add a topic to your questions and take a few
              quizzes to see where you need practice.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {weakTopics.map((topic) => (
                <div
                  key={topic}
                  className="rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-medium text-coral"
                >
                  {topic}
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs leading-relaxed text-ink-secondary dark:text-ink-secondary-dark">
            Topics where you scored under 60% across your last 10 quizzes.
          </p>
        </div>
      </div>
    </>
  );
}