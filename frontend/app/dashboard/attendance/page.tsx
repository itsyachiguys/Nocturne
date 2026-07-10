import { PageHeader } from "@/components/PageHeader";
import { ATTENDANCE_BY_SUBJECT, ATTENDANCE_TREND } from "@/lib/academic-data";

const STATUS_COLOR = {
  safe: "bg-mint",
  warning: "bg-pastel-orange",
  danger: "bg-coral",
} as const;

export default function AttendancePage() {
  const overall = Math.round(
    (ATTENDANCE_BY_SUBJECT.reduce((sum, r) => sum + r.attended, 0) /
      ATTENDANCE_BY_SUBJECT.reduce((sum, r) => sum + r.total, 0)) *
      100
  );

  return (
    <>
      <PageHeader title="Attendance" subtitle="Live tracking with predictive alerts" />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">Overall attendance</p>
          <p className="font-display text-3xl font-extrabold">{overall}%</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">At risk subjects</p>
          <p className="font-display text-3xl font-extrabold text-coral">
            {ATTENDANCE_BY_SUBJECT.filter((r) => r.status !== "safe").length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">Classes this week</p>
          <p className="font-display text-3xl font-extrabold">18</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5">
          <h4 className="mb-4 text-[14.5px]">Attendance by subject</h4>
          {ATTENDANCE_BY_SUBJECT.map((record) => {
            const pct = Math.round((record.attended / record.total) * 100);
            return (
              <div key={record.subject} className="border-b border-line py-3 last:border-none dark:border-line-dark">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>{record.subject}</span>
                  <span className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                    {record.attended}/{record.total} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark">
                  <div className={`h-1.5 rounded-full ${STATUS_COLOR[record.status]}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card p-5">
          <h4 className="mb-4 text-[14.5px]">8-week trend</h4>
          <div className="flex h-40 items-end gap-2">
            {ATTENDANCE_TREND.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-to-b from-sky to-lavender-dark" style={{ height: `${v}%` }} />
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-secondary dark:text-ink-secondary-dark">
            Thermodynamics is trending below the 75% eligibility threshold. Attend the next 3 sessions to recover.
          </p>
        </div>
      </div>
    </>
  );
}
