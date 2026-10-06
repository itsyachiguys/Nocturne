"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconArrowLeft,
  IconPencil,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import QuestionModal from "@/components/quizzes/QuestionModal";
import { SUBJECTS } from "@/lib/academic-data";
import { useUid } from "@/lib/use-uid";
import {
  addQuestion,
  deleteQuestion,
  getQuiz,
  subscribeQuestions,
  updateQuestion,
  type QuestionInput,
  type Quiz,
  type QuizQuestion,
} from "@/lib/quizzes";

export default function QuizEditorPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { uid, loading: authLoading } = useUid();

  const [quiz, setQuiz] = useState<Quiz | null | undefined>(undefined);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuizQuestion | null>(null);

  useEffect(() => {
    if (!uid || !quizId) return;
    let cancelled = false;

    getQuiz(uid, quizId)
      .then((q) => !cancelled && setQuiz(q))
      .catch(() => {
        if (!cancelled) {
          setQuiz(null);
          setError("Couldn't load this quiz.");
        }
      });

    const unsub = subscribeQuestions(uid, quizId, setQuestions, () =>
      setError("Couldn't load the questions. Check your permissions.")
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid, quizId]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(q: QuizQuestion) {
    setEditing(q);
    setModalOpen(true);
  }

  async function handleSave(input: QuestionInput) {
    if (!uid) throw new Error("You're signed out. Sign in and try again.");
    if (editing) await updateQuestion(uid, quizId, editing.id, input);
    else await addQuestion(uid, quizId, input);
  }

  async function handleDelete(q: QuizQuestion) {
    if (!uid) return;
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteQuestion(uid, quizId, q.id);
    } catch {
      setError("Couldn't delete that question. Try again.");
    }
  }

  const subjectName =
    SUBJECTS.find((s) => s.id === quiz?.subjectId)?.name ?? "No subject";
  const count = questions?.length ?? 0;

  if (!authLoading && !uid) {
    return <p className="text-sm text-coral">Sign in to use quizzes.</p>;
  }

  if (quiz === null) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-coral">{error || "Quiz not found."}</p>
        <Link
          href="/dashboard/quizzes"
          className="text-sm font-semibold text-lavender"
        >
          Back to quizzes
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/dashboard/quizzes"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-secondary hover:text-ink-primary dark:text-ink-secondary-dark"
      >
        <IconArrowLeft size={16} /> All quizzes
      </Link>

      <PageHeader
        title={quiz?.title ?? "Quiz"}
        subtitle={
          quiz
            ? `${subjectName} • ${quiz.difficulty} • ${
                quiz.timerMinutes > 0 ? `${quiz.timerMinutes} min` : "No timer"
              }`
            : "Loading…"
        }
      />

      {error && (
        <p role="alert" className="mb-4 text-sm text-coral">
          {error}
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openAdd}
          className="btn-primary flex items-center gap-2 px-5 py-2.5"
        >
          <IconPlus size={18} />
          Add question
        </button>

        {count > 0 ? (
          <Link
            href={`/dashboard/quizzes/${quizId}/take`}
            className="flex items-center gap-2 rounded-2xl border border-line px-5 py-2.5 text-sm font-medium text-ink-primary dark:border-line-dark dark:text-ink-primary-dark"
          >
            <IconPlayerPlay size={18} />
            Start quiz
          </Link>
        ) : null}

        <span className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
          {count} {count === 1 ? "question" : "questions"}
        </span>
      </div>

      {questions === null ? (
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
          Loading…
        </p>
      ) : questions.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
            This quiz has no questions yet. Add your first one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                    Question {idx + 1}
                    {q.topic ? ` • ${q.topic}` : ""}
                  </p>
                  <p className="mt-1 font-medium text-ink-primary dark:text-ink-primary-dark">
                    {q.prompt}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(q)}
                    aria-label="Edit question"
                    className="text-ink-secondary hover:text-lavender dark:text-ink-secondary-dark"
                  >
                    <IconPencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(q)}
                    aria-label="Delete question"
                    className="text-ink-secondary hover:text-coral dark:text-ink-secondary-dark"
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {q.options.map((opt, i) => {
                  const correct = i === q.correctIndex;
                  return (
                    <li
                      key={i}
                      className={`rounded-2xl border px-4 py-2.5 text-sm ${
                        correct
                          ? "border-mint/30 bg-mint/10 font-medium text-mint"
                          : "border-line text-ink-primary dark:border-line-dark dark:text-ink-primary-dark"
                      }`}
                    >
                      {opt}
                      {correct ? " (correct)" : ""}
                    </li>
                  );
                })}
              </ul>

              {q.explanation && (
                <p className="mt-3 text-xs leading-relaxed text-ink-secondary dark:text-ink-secondary-dark">
                  {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <QuestionModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}