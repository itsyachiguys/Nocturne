"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import AttendanceList from "@/components/attendance/AttendanceList";

import { Subject } from "@/types/subject";
import { Attendance } from "@/types/attendance";

import { SubjectService } from "@/services/subject.service";
import { AttendanceService } from "@/services/attendance.service";

import { useAuth } from "@/context/AuthContext";

export default function AttendancePage() {
  const { user, loading: authLoading } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const studentId = user?.uid ?? "";

  const loadAttendance = useCallback(async () => {
    if (!studentId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [subjectData, attendanceData] = await Promise.all([
        SubjectService.getByStudent(studentId),
        AttendanceService.getByStudent(studentId),
      ]);

      setSubjects(subjectData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Failed to load attendance:", error);

      setError(
        "Failed to load attendance. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (!authLoading && studentId) {
      loadAttendance();
    }
  }, [authLoading, studentId, loadAttendance]);

  /*
   * ==========================================================
   * OVERALL ATTENDANCE
   * ==========================================================
   */

  const overall = useMemo(() => {
    if (attendance.length === 0) {
      return 0;
    }

    const present = attendance.filter(
      (record) => record.status === "present"
    ).length;

    return Number(
      ((present / attendance.length) * 100).toFixed(2)
    );
  }, [attendance]);

  /*
   * ==========================================================
   * ATTENDANCE BY SUBJECT
   * ==========================================================
   */

  const subjectAttendance = useMemo(() => {
    return subjects.map((subject) => {
      const records = attendance.filter(
        (record) => record.subjectId === subject.id
      );

      const total = records.length;

      const present = records.filter(
        (record) => record.status === "present"
      ).length;

      const percentage =
        total === 0
          ? 0
          : Number(
              ((present / total) * 100).toFixed(2)
            );

      return {
        subject,
        total,
        present,
        absent: total - present,
        percentage,
      };
    });
  }, [subjects, attendance]);

  /*
   * ==========================================================
   * AT-RISK SUBJECTS
   * ==========================================================
   */

  const atRiskSubjects = subjectAttendance.filter(
    (record) =>
      record.total > 0 &&
      record.percentage < 75
  ).length;

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (authLoading || loading) {
    return (
      <div className="p-8">
        Loading attendance...
      </div>
    );
  }

  /*
   * ==========================================================
   * NOT LOGGED IN
   * ==========================================================
   */

  if (!studentId) {
    return (
      <div className="p-8">
        <div className="card p-8">
          <h2 className="text-lg font-semibold">
            Please log in
          </h2>

          <p className="mt-2 text-sm text-ink-secondary">
            You need to be logged in to view attendance.
          </p>
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="Track your classes and stay above the eligibility threshold"
      />

      {error && (
        <div className="mb-6 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error}
        </div>
      )}

      {/* ======================================================
          OVERVIEW
          ====================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">

        {/* Overall Attendance */}

        <div className="card p-6">

          <p className="text-xs uppercase tracking-widest text-ink-secondary">
            Overall Attendance
          </p>

          <p
            className={`mt-3 font-display text-5xl font-bold ${
              overall < 75
                ? "text-coral"
                : "text-lavender-dark"
            }`}
          >
            {overall}%
          </p>

          <p className="mt-2 text-sm text-ink-secondary">
            {attendance.length} total classes
          </p>

        </div>

        {/* At Risk */}

        <div className="card p-6">

          <p className="text-xs uppercase tracking-widest text-ink-secondary">
            At Risk Subjects
          </p>

          <p className="mt-3 font-display text-5xl font-bold text-coral">
            {atRiskSubjects}
          </p>

          <p className="mt-2 text-sm text-ink-secondary">
            Below 75% attendance
          </p>

        </div>

        {/* Classes */}

        <div className="card p-6">

          <p className="text-xs uppercase tracking-widest text-ink-secondary">
            Classes Recorded
          </p>

          <p className="mt-3 font-display text-5xl font-bold">
            {attendance.length}
          </p>

          <p className="mt-2 text-sm text-ink-secondary">
            Across all subjects
          </p>

        </div>

      </div>

      {/* ======================================================
          FORM
          ====================================================== */}

      <div className="mb-8">
        <AttendanceForm
          studentId={studentId}
          subjects={subjects}
          onSaved={loadAttendance}
        />
      </div>

      {/* ======================================================
          SUBJECT SUMMARY
          ====================================================== */}

      <div className="mb-8 card p-6">

        <h3 className="mb-6 text-lg font-semibold">
          Attendance by Subject
        </h3>

        {subjectAttendance.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            No subjects found.
          </p>
        ) : (
          <div className="space-y-6">

            {subjectAttendance.map((record) => {
              const percentage = record.percentage;

              return (
                <div key={record.subject.id}>

                  <div className="mb-2 flex items-center justify-between gap-4">

                    <div>

                      <p className="font-medium">
                        {record.subject.name}
                      </p>

                      <p className="text-xs text-ink-secondary">
                        {record.present}/{record.total} classes attended
                      </p>

                    </div>

                    <span
                      className={`text-sm font-semibold ${
                        percentage < 75
                          ? "text-coral"
                          : "text-lavender-dark"
                      }`}
                    >
                      {percentage}%
                    </span>

                  </div>

                  <div className="h-2.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark">

                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        percentage < 75
                          ? "bg-coral"
                          : "bg-mint"
                      }`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                  {record.total > 0 &&
                    percentage < 75 && (
                      <p className="mt-2 text-xs text-coral">
                        This subject is below the 75% eligibility
                        threshold.
                      </p>
                    )}

                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* ======================================================
          HISTORY
          ====================================================== */}

      <AttendanceList
        attendance={attendance}
        subjects={subjects}
        onChanged={loadAttendance}
      />
    </>
  );
}