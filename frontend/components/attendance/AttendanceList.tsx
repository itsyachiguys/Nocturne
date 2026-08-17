"use client";

import { useState } from "react";

import { Attendance } from "@/types/attendance";
import { Subject } from "@/types/subject";
import { AttendanceService } from "@/services/attendance.service";

interface AttendanceListProps {
  attendance: Attendance[];
  subjects: Subject[];
  onChanged?: () => void;
}

export default function AttendanceList({
  attendance,
  subjects,
  onChanged,
}: AttendanceListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function getSubjectName(subjectId: string) {
    return (
      subjects.find((subject) => subject.id === subjectId)?.name ??
      "Unknown Subject"
    );
  }

  async function handleUpdate(
    attendanceId: string,
    status: "present" | "absent"
  ) {
    try {
      setSavingId(attendanceId);

      await AttendanceService.update(attendanceId, {
        status,
      });

      setEditingId(null);
      onChanged?.();
    } catch (error) {
      console.error("Failed to update attendance:", error);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(attendanceId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this attendance record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(attendanceId);

      await AttendanceService.delete(attendanceId);

      onChanged?.();
    } catch (error) {
      console.error("Failed to delete attendance:", error);
    } finally {
      setDeletingId(null);
    }
  }

  if (attendance.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-ink-primary dark:text-ink-primary-dark">
          Attendance History
        </h3>

        <p className="mt-2 text-sm text-ink-secondary dark:text-ink-secondary-dark">
          No attendance records have been added yet.
        </p>
      </div>
    );
  }

  const sortedAttendance = [...attendance].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-ink-primary dark:text-ink-primary-dark">
          Attendance History
        </h3>

        <p className="mt-1 text-sm text-ink-secondary dark:text-ink-secondary-dark">
          Edit or remove individual class records.
        </p>
      </div>

      <div className="space-y-3">
        {sortedAttendance.map((record) => {
          const isEditing = editingId === record.id;
          const isSaving = savingId === record.id;
          const isDeleting = deletingId === record.id;

          return (
            <div
              key={record.id}
              className="rounded-2xl border border-line p-4 dark:border-line-dark"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink-primary dark:text-ink-primary-dark">
                    {getSubjectName(record.subjectId)}
                  </p>

                  <p className="mt-1 text-sm text-ink-secondary dark:text-ink-secondary-dark">
                    {record.date}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() =>
                          handleUpdate(record.id, "present")
                        }
                        className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                          record.status === "present"
                            ? "border-mint bg-mint/30"
                            : "border-line hover:bg-zinc-100 dark:border-line-dark dark:hover:bg-zinc-800"
                        }`}
                      >
                        {isSaving && record.status === "present"
                          ? "Saving..."
                          : "Present"}
                      </button>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() =>
                          handleUpdate(record.id, "absent")
                        }
                        className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                          record.status === "absent"
                            ? "border-coral bg-coral/20"
                            : "border-line hover:bg-zinc-100 dark:border-line-dark dark:hover:bg-zinc-800"
                        }`}
                      >
                        {isSaving && record.status === "absent"
                          ? "Saving..."
                          : "Absent"}
                      </button>

                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-line px-3 py-2 text-xs font-medium hover:bg-zinc-100 dark:border-line-dark dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          record.status === "present"
                            ? "bg-mint/30 text-green-700"
                            : "bg-coral/20 text-red-700"
                        }`}
                      >
                        {record.status === "present"
                          ? "Present"
                          : "Absent"}
                      </span>

                      <button
                        type="button"
                        onClick={() => setEditingId(record.id)}
                        className="rounded-lg border border-line px-3 py-2 text-xs font-medium hover:bg-zinc-100 dark:border-line-dark dark:hover:bg-zinc-800"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(record.id)}
                        className="rounded-lg border border-coral/30 px-3 py-2 text-xs font-medium text-coral hover:bg-coral/10 disabled:opacity-50"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}