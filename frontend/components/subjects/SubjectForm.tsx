"use client";

import { useEffect, useState } from "react";
import { CreateSubjectData } from "@/types/subject";

const COLORS = [
  "#A78BFA",
  "#60A5FA",
  "#34D399",
  "#FBBF24",
  "#FB7185",
  "#F472B6",
];

interface Props {
  onSubmit: (data: CreateSubjectData) => Promise<void>;
  studentId: string;

  initialData?: Partial<CreateSubjectData>;

  submitLabel?: string;
}

export default function SubjectForm({
  onSubmit,
  studentId,
  initialData,
  submitLabel = "Create Subject",
}: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [code, setCode] = useState(initialData?.code ?? "");
  const [semester, setSemester] = useState(
    initialData?.semester ?? 1
  );
  const [credits, setCredits] = useState(
    initialData?.credits ?? 4
  );
  const [faculty, setFaculty] = useState(
    initialData?.faculty ?? ""
  );
  const [color, setColor] = useState(
    initialData?.color ?? COLORS[0]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * If the subject is loaded after the component mounts,
   * populate the form with the subject's existing values.
   */
  useEffect(() => {
    if (!initialData) return;

    setName(initialData.name ?? "");
    setCode(initialData.code ?? "");
    setSemester(initialData.semester ?? 1);
    setCredits(initialData.credits ?? 4);
    setFaculty(initialData.faculty ?? "");
    setColor(initialData.color ?? COLORS[0]);
  }, [initialData]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        studentId,
        name: name.trim(),
        code: code.trim(),
        semester,
        credits,
        faculty: faculty.trim(),
        color,
      });

      /*
       * Only clear the form when creating a new subject.
       * Edit mode keeps the saved values visible.
       */
      if (!initialData) {
        setName("");
        setCode("");
        setSemester(1);
        setCredits(4);
        setFaculty("");
        setColor(COLORS[0]);
      }
    } catch (error) {
      console.error("Failed to save subject:", error);

      setError(
        "Failed to save subject. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card space-y-6 rounded-2xl p-6"
    >
      {/* Error */}
      {error && (
        <div className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error}
        </div>
      )}

      {/* Subject Name */}
      <div>
        <label
          htmlFor="subject-name"
          className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
        >
          Subject Name
        </label>

        <input
          id="subject-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Machine Learning"
          className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
        />
      </div>

      {/* Subject Code */}
      <div>
        <label
          htmlFor="subject-code"
          className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
        >
          Subject Code
        </label>

        <input
          id="subject-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. CE0567"
          className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
        />
      </div>

      {/* Semester + Credits */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="subject-semester"
            className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
          >
            Semester
          </label>

          <input
            id="subject-semester"
            type="number"
            min={1}
            max={8}
            required
            value={semester}
            onChange={(e) =>
              setSemester(Number(e.target.value))
            }
            className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
          />
        </div>

        <div>
          <label
            htmlFor="subject-credits"
            className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
          >
            Credits
          </label>

          <input
            id="subject-credits"
            type="number"
            min={1}
            max={10}
            required
            value={credits}
            onChange={(e) =>
              setCredits(Number(e.target.value))
            }
            className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
          />
        </div>
      </div>

      {/* Faculty */}
      <div>
        <label
          htmlFor="subject-faculty"
          className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
        >
          Faculty
        </label>

        <input
          id="subject-faculty"
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          placeholder="e.g. Dr. John Smith"
          className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
        />
      </div>

      {/* Color */}
      <div>
        <label
          htmlFor="subject-color"
          className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark"
        >
          Theme Color
        </label>

        <select
          id="subject-color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full rounded-xl border border-line px-4 py-3 outline-none transition focus:border-lavender-dark"
        >
          {COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}