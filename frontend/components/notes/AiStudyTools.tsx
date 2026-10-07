"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { AiStudyService, MAX_UPLOAD_BYTES } from "@/services/ai-study.service";
import { saveAttempt, type AttemptInput } from "@/lib/quizzes";
import { saveExamAttempt, type ExamResult } from "@/lib/mock-exams";
import ExamView from "@/components/notes/ExamView";
import type {
  AiOutputMap,
  AiOutputType,
  AiSource,
  AiSourceKind,
  ExamOutput,
  FlashcardsOutput,
  QuizOutput,
  SummaryOutput,
} from "@/types/ai-study";

type QuizResult = Pick<AttemptInput, "correctCount" | "totalCount" | "durationSec" | "topicResults">;

const ACTIONS: { type: AiOutputType; label: string; hint: string }[] = [
  { type: "summary", label: "Summary", hint: "Key points and sections" },
  { type: "flashcards", label: "Flashcards", hint: "Flip cards to memorise" },
  { type: "quiz", label: "Quiz", hint: "10 multiple-choice questions" },
  { type: "exam", label: "Mock exam", hint: "Timed paper with marks" },
];

function kindOf(file: File): AiSourceKind | null {
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (n.endsWith(".txt") || n.endsWith(".md")) return "text";
  return null;
}

const fmtSize = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

/* ------------------------------------------------------------------ */
/* Result views                                                        */
/* ------------------------------------------------------------------ */

function SummaryView({ data }: { data: SummaryOutput }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{data.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{data.overview}</p>
      </div>

      <div className="rounded-xl bg-violet-50 p-4 dark:bg-violet-500/10">
        <p className="mb-2 text-sm font-semibold text-violet-700 dark:text-violet-300">Key points</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
          {data.keyPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      {data.sections.map((s, i) => (
        <div key={i}>
          <p className="mb-1.5 text-sm font-semibold text-zinc-900 dark:text-white">{s.heading}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
            {s.points.map((p, j) => (
              <li key={j}>{p}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FlashcardsView({ data }: { data: FlashcardsOutput }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = data.cards[i];

  function go(step: number) {
    setFlipped(false);
    setI((cur) => (cur + step + data.cards.length) % data.cards.length);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span className="font-semibold text-zinc-900 dark:text-white">{data.title}</span>
        <span>
          {i + 1} / {data.cards.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "Show question" : "Show answer"}
        className={`flex min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border p-8 text-center transition-colors ${
          flipped
            ? "border-violet-500 bg-violet-600 text-white"
            : "border-zinc-200 bg-white text-zinc-900 hover:border-violet-400 dark:border-white/15 dark:bg-white/5 dark:text-white"
        }`}
      >
        <span className={`mb-3 text-[11px] font-semibold uppercase tracking-wider ${flipped ? "text-white/80" : "text-zinc-400"}`}>
          {flipped ? "Answer" : "Question"}
        </span>
        <span className="text-lg font-medium leading-snug">{flipped ? card.back : card.front}</span>
        {!flipped && <span className="mt-4 text-xs text-zinc-400">Tap to reveal</span>}
      </button>

      <div className="flex justify-between gap-3">
        <button type="button" onClick={() => go(-1)} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/10">
          Previous
        </button>
        <button type="button" onClick={() => go(1)} className="btn-primary">
          Next card
        </button>
      </div>
    </div>
  );
}

function QuizView({ data, onFinish }: { data: QuizOutput; onFinish: (result: QuizResult) => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => data.questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const startedAt = useRef(Date.now());

  const score = data.questions.filter((q, i) => answers[i] === q.answerIndex).length;
  const allAnswered = answers.every((a) => a !== null);
  const weakTopics = Array.from(
    new Set(data.questions.filter((q, i) => answers[i] !== q.answerIndex).map((q) => q.topic))
  );

  function reset() {
    setAnswers(data.questions.map(() => null));
    setSubmitted(false);
    startedAt.current = Date.now();
  }

  function submit() {
    const byTopic = new Map<string, { correct: number; total: number }>();
    data.questions.forEach((q, i) => {
      const t = byTopic.get(q.topic) ?? { correct: 0, total: 0 };
      t.total += 1;
      if (answers[i] === q.answerIndex) t.correct += 1;
      byTopic.set(q.topic, t);
    });

    setSubmitted(true);
    onFinish({
      correctCount: score,
      totalCount: data.questions.length,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      topicResults: Array.from(byTopic.entries()).map(([topic, t]) => ({ topic, ...t })),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{data.title}</h3>
        {submitted && (
          <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
            Score {score} / {data.questions.length}
          </span>
        )}
      </div>

      {data.questions.map((q, qi) => (
        <div key={qi} className="rounded-xl border border-zinc-200 p-4 dark:border-white/10">
          <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">
            {qi + 1}. {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const picked = answers[qi] === oi;
              const correct = submitted && oi === q.answerIndex;
              const wrong = submitted && picked && oi !== q.answerIndex;
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
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
          </div>
          {submitted && (
            <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{q.explanation}</p>
          )}
        </div>
      ))}

      {submitted && weakTopics.length > 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          <span className="font-semibold">Revise:</span> {weakTopics.join(", ")}
        </p>
      )}

      <div className="flex gap-3">
        {!submitted ? (
          <button type="button" disabled={!allAnswered} onClick={submit} className="btn-primary disabled:opacity-50">
            Check answers
          </button>
        ) : (
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function AiStudyTools() {
  const [uid, setUid] = useState<string | null>(null);
  const [sources, setSources] = useState<AiSource[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<AiOutputMap>({});
  const [active, setActive] = useState<AiOutputType | null>(null);

  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState<AiOutputType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = sources.find((s) => s.id === selectedId) ?? null;

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), []);

  // Load the student's uploaded files.
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    AiStudyService.listSources(uid)
      .then((list) => {
        if (cancelled) return;
        setSources(list);
        setSelectedId((cur) => cur ?? list[0]?.id ?? null);
      })
      .catch((e) => console.error("load ai sources", e));
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Load saved outputs for the selected file, so reopening it needs no new AI call.
  useEffect(() => {
    if (!uid || !selectedId) {
      setOutputs({});
      setActive(null);
      return;
    }
    let cancelled = false;
    setOutputs({});
    setActive(null);
    AiStudyService.getOutputs(uid, selectedId)
      .then((o) => {
        if (cancelled) return;
        setOutputs(o);
        setActive(ACTIONS.find((a) => o[a.type])?.type ?? null);
      })
      .catch((e) => console.error("load ai outputs", e));
    return () => {
      cancelled = true;
    };
  }, [uid, selectedId]);

  async function onFile(file: File) {
    setError(null);
    if (!uid) return setError("Please sign in first.");
    const kind = kindOf(file);
    if (!kind) return setError("Upload a PDF, .txt or .md file.");
    if (file.size > MAX_UPLOAD_BYTES) return setError("File is too large. The limit is 14 MB.");

    try {
      setProgress(0);
      const up = await uploadToCloudinary(file, setProgress);
      const id = await AiStudyService.addSource(uid, {
        name: file.name,
        url: up.secure_url,
        kind,
        bytes: file.size,
        publicId: up.public_id,
      });
      const added: AiSource = {
        id,
        name: file.name,
        url: up.secure_url,
        kind,
        bytes: file.size,
        createdAt: new Date(),
      };
      setSources((list) => [added, ...list]);
      setSelectedId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function run(type: AiOutputType) {
    if (!uid || !selected || busy) return;
    setError(null);
    setBusy(type);
    const sourceId = selected.id;
    try {
      let data: AiOutputMap[AiOutputType] = await AiStudyService.generate(type, selected);

      if (type === "quiz") {
        // Mirror the quiz onto the Quizzes page, and drop the one from a previous generation.
        const quiz = data as QuizOutput;
        const quizId = await AiStudyService.publishQuiz(uid, quiz);
        const previous = outputs.quiz?.quizId;
        if (previous) await AiStudyService.unpublishQuiz(uid, previous);
        data = { ...quiz, quizId };
      }

      if (type === "exam") {
        // Save the paper to the Mock Exams page, and drop the one from a previous generation.
        const exam = data as ExamOutput;
        const examId = await AiStudyService.publishExam(uid, sourceId, selected.name, exam);
        const previous = outputs.exam?.examId;
        if (previous) await AiStudyService.unpublishExam(uid, previous);
        data = { ...exam, examId };
      }

      await AiStudyService.saveOutput(uid, sourceId, type, data as never);
      if (sourceId === selectedId) {
        setOutputs((o) => ({ ...o, [type]: data }));
        setActive(type);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  // Saved to the same `attempts` collection the Quizzes page and dashboard read from.
  async function recordQuizAttempt(result: QuizResult) {
    const quiz = outputs.quiz;
    if (!uid || !quiz?.quizId || result.totalCount === 0) return;
    try {
      await saveAttempt(uid, {
        quizId: quiz.quizId,
        quizTitle: quiz.title,
        subjectId: "",
        score: Math.round((result.correctCount / result.totalCount) * 100), // percentage
        ...result,
      });
    } catch (e) {
      console.error("save quiz attempt", e);
    }
  }

  // Saved to the same examAttempts collection the Mock Exams page reads from.
  async function recordExamAttempt(result: ExamResult) {
    const exam = outputs.exam;
    if (!uid || !exam?.examId) return;
    try {
      await saveExamAttempt(uid, { examId: exam.examId, examTitle: exam.title, ...result });
    } catch (e) {
      console.error("save exam attempt", e);
    }
  }

  async function remove() {
    if (!uid || !selected) return;
    if (!window.confirm(`Remove "${selected.name}" and its generated study material?`)) return;
    setError(null);
    try {
      await AiStudyService.removeSource(uid, selected.id);
      const rest = sources.filter((s) => s.id !== selected.id);
      setSources(rest);
      setSelectedId(rest[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove the file.");
    }
  }

  const uploading = progress !== null;

  return (
    <div className="card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">AI study tools</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Upload a PDF or text file, then turn it into a summary, flashcards, a quiz or a mock exam.
          </p>
        </div>

        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <button type="button" disabled={uploading || !uid} onClick={() => inputRef.current?.click()} className="btn-primary disabled:opacity-60">
            {uploading ? `Uploading ${progress}%` : "Upload file"}
          </button>
        </div>
      </div>

      {uploading && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
          <div className="h-full rounded-full bg-violet-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}

      {sources.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          No files yet. Upload one to get started (PDF, .txt or .md, up to 14 MB).
        </p>
      ) : (
        <>
          {/* File picker */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {sources.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                title={`${s.name} · ${fmtSize(s.bytes)}`}
                className={`max-w-[220px] truncate rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  s.id === selectedId
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
                }`}
              >
                {s.name}
              </button>
            ))}
            {selected && (
              <button type="button" onClick={remove} className="ml-auto text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400">
                Remove file
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ACTIONS.map((a) => {
              const has = !!outputs[a.type];
              const loading = busy === a.type;
              return (
                <div
                  key={a.type}
                  className={`flex flex-col gap-3 rounded-xl border p-4 ${
                    active === a.type
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                      : "border-zinc-200 dark:border-white/10"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{a.label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{a.hint}</p>
                  </div>
                  <div className="mt-auto flex gap-2">
                    {has && (
                      <button type="button" onClick={() => setActive(a.type)} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700">
                        Open
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => run(a.type)}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/10"
                    >
                      {loading ? "Generating…" : has ? "Regenerate" : "Generate"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {busy && (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
              Reading your file and writing the {busy === "exam" ? "mock exam" : busy}. This can take up to a minute.
            </p>
          )}

          {/* Result */}
          {active && outputs[active] && !busy && (
            <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-white/10">
              {active === "summary" && outputs.summary && <SummaryView data={outputs.summary} />}
              {active === "flashcards" && outputs.flashcards && <FlashcardsView key={selectedId} data={outputs.flashcards} />}
              {active === "quiz" && outputs.quiz && (
                <QuizView key={outputs.quiz.quizId ?? selectedId} data={outputs.quiz} onFinish={recordQuizAttempt} />
              )}
              {active === "exam" && outputs.exam && (
                <ExamView key={`${selectedId}-${outputs.exam.examId ?? outputs.exam.title}`} data={outputs.exam} onFinish={recordExamAttempt} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}