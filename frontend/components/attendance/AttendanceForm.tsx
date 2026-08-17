"use client";

import { FormEvent, useState } from "react";

import { Subject } from "@/types/subject";
import { AttendanceService } from "@/services/attendance.service";

interface AttendanceFormProps {
  studentId: string;
  subjects: Subject[];
  onSaved?: () => void;
}

export default function AttendanceForm({
  studentId,
  subjects,
  onSaved,
}: AttendanceFormProps) {
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<"present" | "absent">(
    "present"
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!subjectId) {
      setError("Please select a subject.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      await AttendanceService.create({
        studentId,
        subjectId,
        date,
        status,
        source:"self",
      });

      setMessage("Attendance saved successfully.");

      // Reset only the status.
      // Subject and date stay selected so multiple
      // lectures can be entered quickly.
      setStatus("present");

      onSaved?.();
    } catch (error) {
      console.error("Failed to save attendance:", error);

      setError(
        "Failed to save attendance. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-ink-primary dark:text-ink-primary-dark">
          Mark Attendance
        </h3>

        <p className="mt-1 text-sm text-ink-secondary dark:text-ink-secondary-dark">
          Record each lecture separately. Multiple lectures can
          be recorded on the same day.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Subject */}
        <div>
          <label
            htmlFor="attendance-subject"
            className="mb-2 block text-sm font-medium"
          >
            Subject
          </label>

          <select
            id="attendance-subject"
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);
              setError(null);
              setMessage(null);
            }}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-lavender-dark dark:border-line-dark dark:bg-zinc-900"
          >
            <option value="">Select a subject</option>

            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor="attendance-date"
            className="mb-2 block text-sm font-medium"
          >
            Date
          </label>

          <input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setError(null);
              setMessage(null);
            }}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-lavender-dark dark:border-line-dark dark:bg-zinc-900"
          />
        </div>

        {/* Status */}
        <div>
          <p className="mb-2 text-sm font-medium">Status</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus("present")}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                status === "present"
                  ? "border-mint bg-mint/30"
                  : "border-line hover:bg-zinc-100 dark:border-line-dark dark:hover:bg-zinc-800"
              }`}
            >
              Present
            </button>

            <button
              type="button"
              onClick={() => setStatus("absent")}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                status === "absent"
                  ? "border-coral bg-coral/20"
                  : "border-line hover:bg-zinc-100 dark:border-line-dark dark:hover:bg-zinc-800"
              }`}
            >
              Absent
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-mint/40 bg-mint/20 px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || subjects.length === 0}
          className="w-full rounded-xl bg-lavender-dark px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </form>
    </div>
  );
}