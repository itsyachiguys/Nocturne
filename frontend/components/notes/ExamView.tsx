"use client";

import { useEffect, useRef, useState } from "react";

import { AiStudyService } from "@/services/ai-study.service";
import type { ExamResult } from "@/lib/mock-exams";
import type { ExamGradeItem, ExamOutput, ExamQuestionType } from "@/types/ai-study";

const TYPE_LABEL: Record<ExamQuestionType, string> = {
  mcq: "Multiple choice",
  short: "Short answer",
  long: "Long answer",
};

const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

type Phase = "intro" | "running" | "review";
type Marking = "idle" | "marking" | "done" | "error";

export default function ExamView({
  data,
  onFinish,
}: {
  data: ExamOutput;
  /** Called once, after the written answers have been marked. */
  onFinish?: (result: ExamResult) => void;
}) {
  const timed = data.durationMinutes > 0;
  const total = data.questions.reduce((sum, q) => sum + q.marks, 0);

  const [phase, setPhase] = useState<Phase>("intro");
  const [picks, setPicks] = useState<(number | null)[]>(() => data.questions.map(() => null));
  const [texts, setTexts] = useState<string[]>(() => data.questions.map(() => ""));
  const [left, setLeft] = useState(data.durationMinutes * 60);
  const endsAt = useRef(0);
  const startedAt = useRef(Date.now());
  const reported = useRef(false);

  // AI marking of written answers (null = not marked yet)
  const [marking, setMarking] = useState<Marking>("idle");
  const [markError, setMarkError] = useState<string | null>(null);
  const [awarded, setAwarded] = useState<(number | null)[]>(() => data.questions.map(() => null));
  const [feedback, setFeedback] = useState<string[]>(() => data.questions.map(() => ""));

  async function markAnswers() {
    setMarking("marking");
    setMarkError(null);

    const nextAwarded = data.questions.map<number | null>(() => null);
    const nextFeedback = data.questions.map(() => "");
    const items: ExamGradeItem[] = [];

    data.questions.forEach((q, i) => {
      if (q.type === "mcq") return;
      const answer = texts[i].trim();
      if (!answer) {
        // Blank answers score zero without using the AI.
        nextAwarded[i] = 0;
        nextFeedback[i] = "No answer given.";
        return;
      }
      items.push({
        index: i,
        question: q.question,
        maxMarks: q.marks,
        modelAnswer: q.modelAnswer ?? "",
        markingPoints: q.markingPoints ?? [],
        studentAnswer: answer,
      });
    });

    try {
      if (items.length > 0) {
        const grades = await AiStudyService.gradeExam(items);
        grades.forEach((g) => {
          nextAwarded[g.index] = g.marks;
          nextFeedback[g.index] = g.feedback;
        });
      }
      setAwarded(nextAwarded);
      setFeedback(nextFeedback);
      setMarking("done");
    } catch (e) {
      // Keep the blank-answer zeros, so a retry only needs to mark the rest.
      setAwarded(nextAwarded);
      setFeedback(nextFeedback);
      setMarkError(e instanceof Error ? e.message : "Marking failed.");
      setMarking("error");
    }
  }

  function finish() {
    setPhase("review");
    void markAnswers();
  }

  // Always points at the latest render, so the timer can hand in with current answers.
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    if (phase !== "running" || !timed) return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(id);
        finishRef.current(); // time is up: hand in automatically
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [phase, timed]);

  function start() {
    startedAt.current = Date.now();
    reported.current = false;
    endsAt.current = Date.now() + data.durationMinutes * 60 * 1000;
    setLeft(data.durationMinutes * 60);
    setPhase("running");
  }

  function restart() {
    setPicks(data.questions.map(() => null));
    setTexts(data.questions.map(() => ""));
    setAwarded(data.questions.map(() => null));
    setFeedback(data.questions.map(() => ""));
    setMarking("idle");
    setMarkError(null);
    reported.current = false;
    setPhase("intro");
  }

  function handIn() {
    const unanswered = data.questions.filter((q, i) =>
      q.type === "mcq" ? picks[i] === null : texts[i].trim() === ""
    ).length;
    if (unanswered > 0 && !window.confirm(`${unanswered} question(s) are unanswered. Hand in anyway?`)) return;
    finish();
  }

  const mcqScore = data.questions.reduce(
    (sum, q, i) => (q.type === "mcq" && picks[i] === q.answerIndex ? sum + q.marks : sum),
    0
  );
  const writtenScore = data.questions.reduce((sum, q, i) => (q.type === "mcq" ? sum : sum + (awarded[i] ?? 0)), 0);
  const score = mcqScore + writtenScore;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  // Report the finished result once (for saving to the exam history).
  useEffect(() => {
    if (marking !== "done" || reported.current || !onFinish) return;
    reported.current = true;

    const byTopic = new Map<string, { correct: number; total: number }>();
    data.questions.forEach((q, i) => {
      const earned = q.type === "mcq" ? (picks[i] === q.answerIndex ? q.marks : 0) : awarded[i] ?? 0;
      const t = byTopic.get(q.topic) ?? { correct: 0, total: 0 };
      t.correct += earned;
      t.total += q.marks;
      byTopic.set(q.topic, t);
    });

    onFinish({
      score: pct,
      marksAwarded: score,
      totalMarks: total,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      topicResults: Array.from(byTopic.entries()).map(([topic, t]) => ({ topic, ...t })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marking]);

  /* ----------------------------- intro ----------------------------- */
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{data.title}</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {data.questions.length} questions · {total} marks · {timed ? `${data.durationMinutes} minutes` : "untimed"}
          </p>
        </div>

        {data.instructions.length > 0 && (
          <ul className="list-disc space-y-1 rounded-xl bg-violet-50 p-4 pl-8 text-sm text-zinc-700 dark:bg-violet-500/10 dark:text-zinc-200">
            {data.instructions.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}

        <button type="button" onClick={start} className="btn-primary">
          {timed ? "Start exam and timer" : "Start exam"}
        </button>
      </div>
    );
  }

  const reviewing = phase === "review";

  /* ------------------------ running + review ------------------------ */
  return (
    <div className="space-y-5">
      <div
        className={`sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 backdrop-blur ${
          reviewing
            ? "border-violet-500 bg-violet-50/95 dark:bg-violet-500/15"
            : timed && left <= 60
            ? "border-rose-500 bg-rose-50/95 dark:bg-rose-500/15"
            : "border-zinc-200 bg-white/95 dark:border-white/10 dark:bg-zinc-900/95"
        }`}
      >
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{data.title}</span>
        {reviewing ? (
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            {marking === "marking"
              ? "Marking your answers…"
              : marking === "done"
              ? `${score} / ${total} marks (${pct}%)`
              : `${mcqScore} marks so far (written answers not marked)`}
          </span>
        ) : timed ? (
          <span className="font-mono text-base font-semibold tabular-nums text-zinc-900 dark:text-white" aria-live="off">
            {fmtClock(left)}
          </span>
        ) : null}
      </div>

      {reviewing && marking === "marking" && (
        <p className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-800 dark:bg-violet-500/10 dark:text-violet-200" aria-live="polite">
          The AI is marking your written answers against the marking points. This can take up to a minute.
        </p>
      )}

      {reviewing && marking === "error" && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <span>{markError}</span>
          <button type="button" onClick={() => void markAnswers()} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 dark:border-rose-400/40 dark:hover:bg-rose-500/20">
            Try marking again
          </button>
        </div>
      )}

      {data.questions.map((q, qi) => (
        <div key={qi} className="rounded-xl border border-zinc-200 p-4 dark:border-white/10">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              {TYPE_LABEL[q.type]} · {q.topic}
            </span>
            <span className="font-semibold">
              {q.marks} {q.marks === 1 ? "mark" : "marks"}
            </span>
          </div>
          <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">
            {qi + 1}. {q.question}
          </p>

          {q.type === "mcq" ? (
            <div className="space-y-2">
              {(q.options ?? []).map((opt, oi) => {
                const picked = picks[qi] === oi;
                const correct = reviewing && oi === q.answerIndex;
                const wrong = reviewing && picked && oi !== q.answerIndex;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={reviewing}
                    onClick={() => setPicks((p) => p.map((v, i) => (i === qi ? oi : v)))}
                    className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      correct
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200"
                        : wrong
                        ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-500/15 dark:text-rose-200"
                        : picked
                        ? "border-violet-500 bg-violet-50 text-zinc-900 dark:bg-violet-500/15 dark:text-white"
                        : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="font-semibold">{String.fromCharCode(65 + oi)}.</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
              {reviewing && (
                <p className="pt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {picks[qi] === q.answerIndex ? q.marks : 0} / {q.marks}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={texts[qi]}
                disabled={reviewing}
                onChange={(e) => setTexts((t) => t.map((v, i) => (i === qi ? e.target.value : v)))}
                rows={q.type === "long" ? 8 : 4}
                placeholder="Write your answer here"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-violet-500 focus:outline-none disabled:opacity-80 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />

              {reviewing && (
                <div className="space-y-3 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-500/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">Your marks</span>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-zinc-900 dark:bg-white/10 dark:text-white">
                      {awarded[qi] === null ? (marking === "marking" ? "Marking…" : "Not marked") : `${awarded[qi]}`} / {q.marks}
                    </span>
                  </div>

                  {feedback[qi] && (
                    <p className="leading-relaxed text-zinc-700 dark:text-zinc-200">
                      <span className="font-semibold">Feedback: </span>
                      {feedback[qi]}
                    </p>
                  )}

                  <div>
                    <p className="mb-1 font-semibold text-emerald-800 dark:text-emerald-300">Model answer</p>
                    <p className="whitespace-pre-line leading-relaxed text-zinc-700 dark:text-zinc-200">{q.modelAnswer}</p>
                  </div>

                  {q.markingPoints && q.markingPoints.length > 0 && (
                    <div>
                      <p className="mb-1 font-semibold text-emerald-800 dark:text-emerald-300">Marks are given for</p>
                      <ul className="list-disc space-y-0.5 pl-5 text-zinc-700 dark:text-zinc-200">
                        {q.markingPoints.map((m, mi) => (
                          <li key={mi}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-3">
        {reviewing ? (
          <button type="button" disabled={marking === "marking"} onClick={restart} className="btn-primary disabled:opacity-50">
            Retake exam
          </button>
        ) : (
          <button type="button" onClick={handIn} className="btn-primary">
            Hand in
          </button>
        )}
      </div>
    </div>
  );
}