"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import ExamView from "@/components/notes/ExamView";
import { PageHeader } from "@/components/PageHeader";
import { getMockExam, saveExamAttempt, type ExamResult, type MockExam } from "@/lib/mock-exams";
import { useUid } from "@/lib/use-uid";

export default function TakeMockExamPage() {
  const uid = useUid();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [exam, setExam] = useState<MockExam | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [attempt, setAttempt] = useState(0); // bump to retry loading

  useEffect(() => {
    if (!uid || !id) return;
    let cancelled = false;
    setError(null);
    setExam(undefined);

    // A read that never answers (Firestore offline) must not leave the page loading forever.
    const timer = setTimeout(() => {
      if (!cancelled) {
        setError("Loading is taking too long. Your connection to Firestore may be blocked or offline.");
      }
    }, 15000);

    getMockExam(uid, id)
      .then((e) => {
        if (cancelled) return;
        clearTimeout(timer);
        setError(null);
        setExam(e);
      })
      .catch((e) => {
        console.error("getMockExam", e);
        if (cancelled) return;
        clearTimeout(timer);
        setError(
          e?.code === "permission-denied"
            ? "You don't have permission to read this exam. Add the mockExams rule in Firestore."
            : "Couldn't load this exam. Check your connection and try again."
        );
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [uid, id, attempt]);

  async function recordAttempt(result: ExamResult) {
    if (!uid || !exam) return;
    setSaveError(false);
    try {
      await saveExamAttempt(uid, { examId: exam.id, examTitle: exam.title, ...result });
    } catch (e) {
      console.error("saveExamAttempt", e);
      setSaveError(true);
    }
  }

  return (
    <>
      <PageHeader title={exam?.title ?? "Mock exam"} subtitle="Answer the paper, hand in, and get it marked" />

      <Link
        href="/dashboard/mock-exams"
        className="mb-4 inline-block text-sm font-medium text-ink-secondary hover:underline dark:text-ink-secondary-dark"
      >
        Back to mock exams
      </Link>

      {uid === null ? (
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">Please sign in to take this exam.</p>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-coral">{error}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-xl border border-line px-3 py-1.5 text-xs font-semibold dark:border-line-dark"
          >
            Try again
          </button>
        </div>
      ) : exam === undefined || uid === undefined ? (
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">Loading...</p>
      ) : exam === null ? (
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
          This exam no longer exists. It may have been deleted.
        </p>
      ) : (
        <div className="card p-6">
          {saveError && (
            <p role="alert" className="mb-4 text-sm text-coral">
              Your result couldn&apos;t be saved to your history. Check your connection.
            </p>
          )}
          <ExamView key={exam.id} data={exam.exam} onFinish={recordAttempt} />
        </div>
      )}
    </>
  );
}