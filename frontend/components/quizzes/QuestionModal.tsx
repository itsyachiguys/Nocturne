"use client";

import { useEffect, useState } from "react";
import { IconPlus, IconX } from "@tabler/icons-react";
import type { QuestionInput, QuizQuestion } from "@/lib/quizzes";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const inputClass =
  "mt-1 w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark";
const labelClass =
  "text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark";

type Props = {
  open: boolean;
  /** Pass a question to edit it; omit/null to add a new one. */
  initial?: QuizQuestion | null;
  onClose: () => void;
  onSave: (input: QuestionInput) => Promise<void>;
};

export default function QuestionModal({
  open,
  initial,
  onClose,
  onSave,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset the form every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setPrompt(initial?.prompt ?? "");
    setOptions(initial?.options.length ? initial.options : ["", "", "", ""]);
    setCorrectIndex(initial?.correctIndex ?? 0);
    setExplanation(initial?.explanation ?? "");
    setTopic(initial?.topic ?? "");
    setError("");
    setSaving(false);
  }, [open, initial]);

  if (!open) return null;

  function setOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function addOption() {
    if (options.length < MAX_OPTIONS) setOptions((prev) => [...prev, ""]);
  }

  function removeOption(i: number) {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
    setCorrectIndex((c) => (i === c ? 0 : i < c ? c - 1 : c));
  }

  async function handleSave() {
    const cleaned = options.map((o) => o.trim());
    if (!prompt.trim()) return setError("Write the question first.");
    if (cleaned.some((o) => !o))
      return setError("Fill in every option or remove the empty ones.");
    if (new Set(cleaned.map((o) => o.toLowerCase())).size !== cleaned.length)
      return setError("Options must be different from each other.");

    setSaving(true);
    setError("");
    try {
      await onSave({
        prompt: prompt.trim(),
        options: cleaned,
        correctIndex,
        explanation: explanation.trim(),
        topic: topic.trim(),
      });
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't save the question. Try again."
      );
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={initial ? "Edit question" : "Add question"}
        className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h4 className="text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
            {initial ? "Edit question" : "Add a question"}
          </h4>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="text-ink-secondary hover:text-ink-primary dark:text-ink-secondary-dark"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className={labelClass}>Question</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="What does DSA stand for?"
            />
          </label>

          <fieldset>
            <legend className={labelClass}>
              Options (select the correct one)
            </legend>
            <div className="mt-2 space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)}
                    aria-label={`Mark option ${i + 1} as correct`}
                    className="h-4 w-4 accent-mint"
                  />
                  <input
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="w-full rounded-2xl border border-line bg-surface-bg px-4 py-2.5 text-sm focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    disabled={options.length <= MIN_OPTIONS}
                    aria-label={`Remove option ${i + 1}`}
                    className="text-ink-secondary hover:text-coral disabled:opacity-30 dark:text-ink-secondary-dark"
                  >
                    <IconX size={16} />
                  </button>
                </div>
              ))}
            </div>
            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 flex items-center gap-1 text-xs font-semibold text-lavender"
              >
                <IconPlus size={14} /> Add option
              </button>
            )}
          </fieldset>

          <label className="block">
            <span className={labelClass}>Topic (optional)</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={inputClass}
              placeholder="e.g. Arrays, Sorting"
            />
            <span className="mt-1 block text-xs text-ink-secondary dark:text-ink-secondary-dark">
              Topics feed the weak-topics panel on the Quizzes page.
            </span>
          </label>

          <label className="block">
            <span className={labelClass}>Explanation (optional)</span>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Shown on the results screen after you finish"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-coral">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-line px-5 py-2.5 text-sm font-medium text-ink-primary dark:border-line-dark dark:text-ink-primary-dark"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-5 py-2.5"
          >
            {saving ? "Saving…" : initial ? "Save changes" : "Add question"}
          </button>
        </div>
      </div>
    </div>
  );
}
