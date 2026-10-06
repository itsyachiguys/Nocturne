"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconAlertTriangle,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { Subject, SUBJECTS } from "@/lib/academic-data";
import { useUid } from "@/lib/use-uid";
import {
  computeWeakTopics,
  createQuiz,
  deleteQuiz,
  subscribeAttempts,
  subscribeQuizzes,
  type Difficulty,
  type Quiz,
  type QuizAttempt,
} from "@/lib/quizzes";

const inputClass =
  "mt-1 w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark";
const labelClass =
  "text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark";

function scoreColor(score: number) {
  if (score >= 80) return "text-mint";
  if (score >= 60) return "text-pastel-orange";
  return "text-coral";
}

export default function QuizzesPage() {
  const router = useRouter();
  const { uid, loading: authLoading } = useUid();

  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[] | null>(null);
  const [loadError, setLoadError] = useState("");

  
  // Create form
  const [title, setTitle] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!uid) return;
    return subscribeSubjects(
      uid,
      (list) => {
        setSubjects(list);
        // keep the selection valid if it was deleted or not set yet
        setSubjectId((cur) =>
          list.some((s) => s.id === cur) ? cur : list[0]?.id ?? ""
        );
      },
      (e) => console.error("subscribeSubjects", e)
    );
  }, [uid]);
  useEffect(() => {
    if (!uid) return;
    const onError = () =>
      setLoadError("Couldn't load your quizzes. Check your connection and permissions.");
    const unsubQuizzes = subscribeQuizzes(uid, setQuizzes, onError);
    const unsubAttempts = subscribeAttempts(uid, setAttempts, onError);
    return () => {
      unsubQuizzes();
      unsubAttempts();
    };
  }, [uid]);

  const weakTopics = useMemo(
    () => computeWeakTopics(attempts ?? []),
    [attempts]
  );

  const subjectName = (id: string) =>
    SUBJECTS.find((s) => s.id === id)?.name ?? "No subject";

  async function handleCreate() {
    if (!uid) return;
    if (!title.trim()) return setFormError("Give the quiz a title.");
    const minutes = Math.min(180, Math.max(0, Math.floor(timerMinutes) || 0));

    setCreating(true);
    setFormError("");
    try {
      const id = await createQuiz(uid, {
        title: title.trim(),
        subjectId,
        difficulty,
        timerMinutes: minutes,
      });
      router.push(`/dashboard/quizzes/${id}`);
    } catch {
      setFormError("Couldn't create the quiz. Try again.");
      setCreating(false);
    }
  }

  async function handleDelete(quiz: Quiz) {
    if (!uid) return;
    if (!window.confirm(`Delete "${quiz.title}" and all its questions?`)) return;
    try {
      await deleteQuiz(uid, quiz.id);
    } catch {
      setLoadError("Couldn't delete that quiz. Try again.");
    }
  }

  return (
    <>
      <PageHeader
        title="Quizzes"
        subtitle="Build your own quizzes, take them, and track your results"
      />

      {!authLoading && !uid && (
        <p className="mb-4 text-sm text-coral">Sign in to use quizzes.</p>
      )}
      {loadError && (
        <p role="alert" className="mb-4 text-sm text-coral">
          {loadError}
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
                <span className={labelClass}>Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Arrays and linked lists"
                />
              </label>

              <label className="block">
                <span className={labelClass}>Subject</span>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className={inputClass}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className={inputClass}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className={labelClass}>
                  Timer (minutes, 0 for no timer)
                </span>
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Number(e.target.value))}
                  className={inputClass}
                />
              </label>
            </div>

            {formError && (
              <p role="alert" className="mt-4 text-sm text-coral">
                {formError}
              </p>
            )}

            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !uid}
              className="btn-primary mt-6 flex w-full items-center justify-center gap-2 py-3"
            >
              <IconPlus size={18} />
              {creating ? "Creating…" : "Create quiz and add questions"}
            </button>
          </div>

          {/* My Quizzes */}
          <div className="card p-6">
            <h4 className="mb-5 text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
              My Quizzes
            </h4>

            {quizzes === null ? (
              <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
                Loading…
              </p>
            ) : quizzes.length === 0 ? (
              <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
                No quizzes yet. Create one above, then add your questions.
              </p>
            ) : (
              <div className="divide-y divide-line dark:divide-line-dark">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <Link
                      href={`/dashboard/quizzes/${quiz.id}`}
                      className="min-w-0 flex-1"
                    >
                      <p className="truncate font-medium text-ink-primary dark:text-ink-primary-dark">
                        {quiz.title}
                      </p>
                      <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                        {subjectName(quiz.subjectId)} • {quiz.difficulty} •{" "}
                        {quiz.questionCount}{" "}
                        {quiz.questionCount === 1 ? "question" : "questions"}
                        {quiz.timerMinutes > 0
                          ? ` • ${quiz.timerMinutes} min`
                          : ""}
                      </p>
                    </Link>

                    <div className="flex items-center gap-3">
                      {quiz.questionCount > 0 ? (
                        <Link
                          href={`/dashboard/quizzes/${quiz.id}/take`}
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          Start
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/quizzes/${quiz.id}`}
                          className="rounded-2xl border border-line px-4 py-2 text-sm font-medium text-ink-primary dark:border-line-dark dark:text-ink-primary-dark"
                        >
                          Add questions
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(quiz)}
                        aria-label={`Delete ${quiz.title}`}
                        className="text-ink-secondary hover:text-coral dark:text-ink-secondary-dark"
                      >
                        <IconTrash size={18} />
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
              <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
                Loading…
              </p>
            ) : attempts.length === 0 ? (
              <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
                Your finished quizzes will show up here.
              </p>
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
                        {a.completedAt?.toLocaleDateString() ?? "Just now"} •{" "}
                        {a.correctCount}/{a.totalCount} correct
                      </p>
                    </div>
                    <span
                      className={`font-display text-xl font-bold ${scoreColor(
                        a.score
                      )}`}
                    >
                      {a.score}%
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
            <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
              Nothing flagged yet. Add a topic to your questions and take a
              few quizzes to see where you need practice.
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