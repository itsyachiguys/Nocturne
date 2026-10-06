"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconX,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { useUid } from "@/lib/use-uid";
import {
  getQuestions,
  getQuiz,
  saveAttempt,
  type Quiz,
  type QuizQuestion,
} from "@/lib/quizzes";

type Phase = "loading" | "error" | "empty" | "ready" | "running" | "results";

type Result = {
  score: number;
  correctCount: number;
  total: number;
  durationSec: number;
  questions: QuizQuestion[];
  answers: (number | null)[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function scoreColor(score: number) {
  if (score >= 80) return "text-mint";
  if (score >= 60) return "text-pastel-orange";
  return "text-coral";
}

export default function TakeQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { uid, loading: authLoading } = useUid();

  const [phase, setPhase] = useState<Phase>("loading");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);

  const [order, setOrder] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);

  const [result, setResult] = useState<Result | null>(null);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "error">(
    "saving"
  );

  // Refs so finish() always sees the latest values (it can fire from the timer).
  const orderRef = useRef<QuizQuestion[]>([]);
  const answersRef = useRef<(number | null)[]>([]);
  const startedAt = useRef(0);
  const finishedRef = useRef(false);

  /* ---------------------------- load ---------------------------- */
  useEffect(() => {
    if (!uid || !quizId) return;
    let cancelled = false;

    Promise.all([getQuiz(uid, quizId), getQuestions(uid, quizId)])
      .then(([q, qs]) => {
        if (cancelled) return;
        if (!q) return setPhase("error");
        setQuiz(q);
        setAllQuestions(qs);
        setPhase(qs.length === 0 ? "empty" : "ready");
      })
      .catch(() => !cancelled && setPhase("error"));

    return () => {
      cancelled = true;
    };
  }, [uid, quizId]);

  /* ---------------------------- finish -------------------------- */
  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const qs = orderRef.current;
    const ans = answersRef.current;
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000);

    let correctCount = 0;
    const topics = new Map<string, { correct: number; total: number }>();
    qs.forEach((q, i) => {
      const ok = ans[i] === q.correctIndex;
      if (ok) correctCount++;
      const topic = q.topic.trim() || "General";
      const t = topics.get(topic) ?? { correct: 0, total: 0 };
      t.total++;
      if (ok) t.correct++;
      topics.set(topic, t);
    });

    const total = qs.length;
    const score = total ? Math.round((correctCount / total) * 100) : 0;

    setResult({
      score,
      correctCount,
      total,
      durationSec,
      questions: qs,
      answers: ans,
    });
    setPhase("results");

    if (!uid || !quiz) return setSaveState("error");
    setSaveState("saving");
    try {
      await saveAttempt(uid, {
        quizId: quiz.id,
        quizTitle: quiz.title,
        subjectId: quiz.subjectId,
        score,
        correctCount,
        totalCount: total,
        durationSec,
        topicResults: [...topics.entries()].map(([topic, t]) => ({
          topic,
          ...t,
        })),
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [uid, quiz]);

  /* ---------------------------- timer --------------------------- */
  useEffect(() => {
    if (phase !== "running" || !quiz || quiz.timerMinutes <= 0) return;
    const deadline = startedAt.current + quiz.timerMinutes * 60_000;

    const tick = () => {
      const left = Math.ceil((deadline - Date.now()) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) finish();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, quiz, finish]);

  /* ---------------------------- actions ------------------------- */
  function start() {
    if (!quiz) return;
    const shuffled = shuffle(allQuestions);
    const blank = shuffled.map(() => null);

    orderRef.current = shuffled;
    answersRef.current = blank;
    finishedRef.current = false;
    startedAt.current = Date.now();

    setOrder(shuffled);
    setAnswers(blank);
    setIndex(0);
    setResult(null);
    setRemaining(quiz.timerMinutes > 0 ? quiz.timerMinutes * 60 : null);
    setPhase("running");
  }

  function selectAnswer(optionIndex: number) {
    const next = [...answersRef.current];
    next[index] = optionIndex;
    answersRef.current = next;
    setAnswers(next);
  }

  function handleFinishClick() {
    const unanswered = answersRef.current.filter((a) => a === null).length;
    if (
      unanswered > 0 &&
      !window.confirm(
        `${unanswered} ${
          unanswered === 1 ? "question is" : "questions are"
        } unanswered. Finish anyway?`
      )
    ) {
      return;
    }
    finish();
  }

  /* ---------------------------- render -------------------------- */
  if (!authLoading && !uid) {
    return <p className="text-sm text-coral">Sign in to take quizzes.</p>;
  }

  const backLink = (
    <Link
      href={`/dashboard/quizzes/${quizId}`}
      className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-secondary hover:text-ink-primary dark:text-ink-secondary-dark"
    >
      <IconArrowLeft size={16} /> Back to quiz
    </Link>
  );

  if (phase === "loading") {
    return (
      <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
        Loading…
      </p>
    );
  }

  if (phase === "error") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-coral">
          Couldn&apos;t load this quiz. It may have been deleted, or you may
          not have access.
        </p>
        <Link
          href="/dashboard/quizzes"
          className="text-sm font-semibold text-lavender"
        >
          Back to quizzes
        </Link>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <>
        {backLink}
        <PageHeader
          title={quiz?.title ?? "Quiz"}
          subtitle="This quiz has no questions yet"
        />
        <Link
          href={`/dashboard/quizzes/${quizId}`}
          className="btn-primary inline-block px-5 py-2.5"
        >
          Add questions
        </Link>
      </>
    );
  }

  if (phase === "ready" && quiz) {
    return (
      <>
        {backLink}
        <PageHeader title={quiz.title} subtitle="Ready when you are" />
        <div className="card max-w-xl p-6">
          <p className="text-sm text-ink-primary dark:text-ink-primary-dark">
            {allQuestions.length}{" "}
            {allQuestions.length === 1 ? "question" : "questions"} in random
            order.{" "}
            {quiz.timerMinutes > 0
              ? `You have ${quiz.timerMinutes} minutes. The quiz submits itself when time is up.`
              : "There is no time limit."}
          </p>
          <button
            type="button"
            onClick={start}
            className="btn-primary mt-6 w-full py-3"
          >
            Start quiz
          </button>
        </div>
      </>
    );
  }

  /* ------------------------- running --------------------------- */
  if (phase === "running" && quiz) {
    const q = order[index];
    const selected = answers[index];
    const isLast = index === order.length - 1;
    const lowTime = remaining !== null && remaining <= 60;

    return (
      <>
        <PageHeader
          title={quiz.title}
          subtitle={`Question ${index + 1} of ${order.length}`}
        />

        <div className="card max-w-2xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5" aria-label="Jump to question">
              {order.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to question ${i + 1}`}
                  aria-current={i === index}
                  className={`h-7 w-7 rounded-full text-xs font-semibold ${
                    i === index
                      ? "bg-lavender text-white"
                      : answers[i] !== null
                      ? "bg-lavender/20 text-lavender"
                      : "border border-line text-ink-secondary dark:border-line-dark dark:text-ink-secondary-dark"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {remaining !== null && (
              <span
                className={`flex items-center gap-1 text-sm font-semibold ${
                  lowTime ? "text-coral" : "text-ink-primary dark:text-ink-primary-dark"
                }`}
              >
                <IconClock size={16} />
                {formatClock(remaining)}
              </span>
            )}
          </div>

          <p className="text-[15px] font-medium text-ink-primary dark:text-ink-primary-dark">
            {q.prompt}
          </p>

          <div className="mt-5 space-y-2" role="radiogroup" aria-label="Answer options">
            {q.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected === i}
                onClick={() => selectAnswer(i)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                  selected === i
                    ? "border-lavender bg-lavender/10 font-medium text-ink-primary dark:text-ink-primary-dark"
                    : "border-line text-ink-primary hover:border-lavender dark:border-line-dark dark:text-ink-primary-dark"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="rounded-2xl border border-line px-5 py-2.5 text-sm font-medium text-ink-primary disabled:opacity-40 dark:border-line-dark dark:text-ink-primary-dark"
            >
              Previous
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={handleFinishClick}
                className="btn-primary px-5 py-2.5"
              >
                Finish quiz
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(order.length - 1, i + 1))}
                className="btn-primary px-5 py-2.5"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ------------------------- results --------------------------- */
  if (phase === "results" && result && quiz) {
    return (
      <>
        <PageHeader title={quiz.title} subtitle="Results" />

        <div className="card mb-6 max-w-2xl p-6">
          <p
            className={`font-display text-4xl font-bold ${scoreColor(
              result.score
            )}`}
          >
            {result.score}%
          </p>
          <p className="mt-1 text-sm text-ink-secondary dark:text-ink-secondary-dark">
            {result.correctCount} of {result.total} correct •{" "}
            {formatClock(result.durationSec)}
          </p>

          <p
            className={`mt-3 text-xs ${
              saveState === "error"
                ? "text-coral"
                : "text-ink-secondary dark:text-ink-secondary-dark"
            }`}
          >
            {saveState === "saving" && "Saving your result…"}
            {saveState === "saved" && "Saved to your quiz history."}
            {saveState === "error" &&
              "Couldn't save this result to your history. Your score above is still correct."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={start}
              className="btn-primary px-5 py-2.5"
            >
              Retake quiz
            </button>
            <Link
              href="/dashboard/quizzes"
              className="rounded-2xl border border-line px-5 py-2.5 text-sm font-medium text-ink-primary dark:border-line-dark dark:text-ink-primary-dark"
            >
              All quizzes
            </Link>
          </div>
        </div>

        <div className="max-w-2xl space-y-4">
          {result.questions.map((q, i) => {
            const picked = result.answers[i];
            const ok = picked === q.correctIndex;
            return (
              <div key={q.id} className="card p-6">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 ${ok ? "text-mint" : "text-coral"}`}
                    aria-label={ok ? "Correct" : "Incorrect"}
                  >
                    {ok ? <IconCheck size={18} /> : <IconX size={18} />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-ink-primary dark:text-ink-primary-dark">
                      {q.prompt}
                    </p>

                    <p className="mt-2 text-sm text-ink-secondary dark:text-ink-secondary-dark">
                      Your answer:{" "}
                      <span className={ok ? "text-mint" : "text-coral"}>
                        {picked === null ? "Not answered" : q.options[picked]}
                      </span>
                    </p>
                    {!ok && (
                      <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
                        Correct answer:{" "}
                        <span className="text-mint">
                          {q.options[q.correctIndex]}
                        </span>
                      </p>
                    )}
                    {q.explanation && (
                      <p className="mt-2 text-xs leading-relaxed text-ink-secondary dark:text-ink-secondary-dark">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return null;
}