"use client";

import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";

import { Subject } from "@/types/subject";
import { Attendance } from "@/types/attendance";

import { SubjectService } from "@/services/subject.service";
import { AttendanceService } from "@/services/attendance.service";

const STATUS_COLOR = {
  safe: "bg-mint",
  warning: "bg-pastel-orange",
  danger: "bg-coral",
} as const;

type AttendanceStatus = keyof typeof STATUS_COLOR;

interface AttendanceRow {
  subject: Subject;
  attended: number;
  total: number;
  percentage: number;
  status: AttendanceStatus;
}

function getStatus(percentage: number): AttendanceStatus {
  if (percentage < 75) {
    return "danger";
  }

  if (percentage < 85) {
    return "warning";
  }

  return "safe";
}

export default function AttendancePage() {
  const { user, loading: authLoading } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<Attendance[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
   * ===========================================================
   * LOAD ATTENDANCE
   * ===========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      if (authLoading) {
        return;
      }

      if (!user) {
        if (!cancelled) {
          setSubjects([]);
          setRecords([]);
          setLoading(false);
          setError("You must be logged in to view attendance.");
        }

        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [subjectData, attendanceData] =
          await Promise.all([
            SubjectService.getByStudent(user.uid),
            AttendanceService.getByStudent(user.uid),
          ]);

        if (cancelled) {
          return;
        }

        setSubjects(subjectData);
        setRecords(attendanceData);
      } catch (error) {
        console.error(
          "Failed to load attendance:",
          error
        );

        if (!cancelled) {
          setError(
            "Failed to load attendance. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  /*
   * ===========================================================
   * ATTENDANCE BY SUBJECT
   * ===========================================================
   */

  const attendanceBySubject = useMemo<AttendanceRow[]>(
    () => {
      return subjects.map((subject) => {
        const subjectRecords = records.filter(
          (record) =>
            record.subjectId === subject.id
        );

        const total = subjectRecords.length;

        const attended = subjectRecords.filter(
          (record) =>
            record.status === "present"
        ).length;

        const percentage =
          total === 0
            ? 0
            : Math.round(
                (attended / total) * 100
              );

        return {
          subject,
          attended,
          total,
          percentage,
          status: getStatus(percentage),
        };
      });
    },
    [subjects, records]
  );

  /*
   * ===========================================================
   * OVERALL ATTENDANCE
   * ===========================================================
   */

  const overallStats = useMemo(() => {
    const total = records.length;

    const attended = records.filter(
      (record) =>
        record.status === "present"
    ).length;

    const percentage =
      total === 0
        ? 0
        : Math.round(
            (attended / total) * 100
          );

    return {
      total,
      attended,
      percentage,
    };
  }, [records]);

  /*
   * ===========================================================
   * AT-RISK SUBJECTS
   * ===========================================================
   */

  const atRiskSubjects = useMemo(() => {
    return attendanceBySubject.filter(
      (record) =>
        record.total > 0 &&
        record.percentage < 75
    );
  }, [attendanceBySubject]);

  /*
   * ===========================================================
   * CLASSES THIS WEEK
   * ===========================================================
   */

  const classesThisWeek = useMemo(() => {
    const now = new Date();

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();

    const difference =
      day === 0 ? -6 : 1 - day;

    startOfWeek.setDate(
      startOfWeek.getDate() + difference
    );

    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(
      startOfWeek
    );

    endOfWeek.setDate(
      endOfWeek.getDate() + 7
    );

    return records.filter((record) => {
      const date = new Date(
        `${record.date}T00:00:00`
      );

      return (
        date >= startOfWeek &&
        date < endOfWeek
      );
    }).length;
  }, [records]);

  /*
   * ===========================================================
   * LOADING
   * ===========================================================
   */

  if (authLoading || loading) {
    return (
      <>
        <PageHeader
          title="Attendance"
          subtitle="Live tracking with predictive alerts"
        />

        <div className="card p-8">
          <p className="text-sm text-ink-secondary">
            Loading attendance...
          </p>
        </div>
      </>
    );
  }

  /*
   * ===========================================================
   * ERROR
   * ===========================================================
   */

  if (error) {
    return (
      <>
        <PageHeader
          title="Attendance"
          subtitle="Live tracking with predictive alerts"
        />

        <div className="card p-8">
          <h2 className="text-lg font-semibold">
            Unable to load attendance
          </h2>

          <p className="mt-2 text-sm text-ink-secondary">
            {error}
          </p>
        </div>
      </>
    );
  }

  /*
   * ===========================================================
   * PAGE
   * ===========================================================
   */

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="Live tracking with predictive alerts"
      />

      {/* Overview Stats */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card p-6">
          <p className="text-xs uppercase tracking-widest text-ink-secondary">
            Overall Attendance
          </p>

          <p className="mt-3 font-display text-5xl font-bold text-lavender-dark">
            {overallStats.total > 0
              ? `${overallStats.percentage}%`
              : "—"}
          </p>

          {overallStats.total > 0 && (
            <p className="mt-2 text-sm text-ink-secondary">
              {overallStats.attended} of{" "}
              {overallStats.total} classes
            </p>
          )}
        </div>

        <div className="card p-6">
          <p className="text-xs uppercase tracking-widest text-ink-secondary">
            At Risk Subjects
          </p>

          <p className="mt-3 font-display text-5xl font-bold text-coral">
            {atRiskSubjects.length}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-xs uppercase tracking-widest text-ink-secondary">
            Classes This Week
          </p>

          <p className="mt-3 font-display text-5xl font-bold">
            {classesThisWeek}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">

        {/* Attendance by Subject */}
        <div className="card p-6">
          <h4 className="mb-6 text-[15px] font-semibold text-ink-primary">
            Attendance by Subject
          </h4>

          {attendanceBySubject.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="font-medium">
                No subjects found
              </p>

              <p className="mt-2 text-sm text-ink-secondary">
                Add your subjects first to start
                tracking attendance.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {attendanceBySubject.map(
                (record) => (
                  <div
                    key={record.subject.id}
                    className="group"
                  >
                    <div className="mb-2 flex justify-between gap-4 text-sm">
                      <span className="font-medium">
                        {record.subject.name}
                      </span>

                      <span className="whitespace-nowrap text-ink-secondary dark:text-ink-secondary-dark">
                        {record.total > 0
                          ? `${record.attended}/${record.total} • ${record.percentage}%`
                          : "No records"}
                      </span>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark">
                      {record.total > 0 && (
                        <div
                          className={`h-2.5 rounded-full transition-all ${STATUS_COLOR[record.status]}`}
                          style={{
                            width: `${record.percentage}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Attendance Summary */}
        <div className="card p-6">
          <h4 className="mb-6 text-[15px] font-semibold text-ink-primary">
            Attendance Overview
          </h4>

          {records.length === 0 ? (
            <div className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed p-6 text-center">
              <div>
                <p className="font-medium">
                  No attendance recorded yet
                </p>

                <p className="mt-2 text-sm text-ink-secondary">
                  Mark your first class attendance
                  to start seeing your statistics.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl bg-surface-alt p-5 dark:bg-surface-alt-dark">
                <p className="text-xs uppercase tracking-widest text-ink-secondary">
                  Total Classes
                </p>

                <p className="mt-2 font-display text-4xl font-bold">
                  {overallStats.total}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-mint p-4">
                  <p className="text-xs uppercase tracking-widest">
                    Present
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {overallStats.attended}
                  </p>
                </div>

                <div className="rounded-2xl bg-coral p-4">
                  <p className="text-xs uppercase tracking-widest">
                    Absent
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {overallStats.total -
                      overallStats.attended}
                  </p>
                </div>
              </div>

              {atRiskSubjects.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {atRiskSubjects.length === 1
                      ? `${atRiskSubjects[0].subject.name} is`
                      : `${atRiskSubjects.length} subjects are`}{" "}
                    below the 75% eligibility
                    threshold.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}