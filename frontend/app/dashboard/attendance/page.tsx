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
      <PageHeader 
        title="Attendance" 
        subtitle="Live tracking with predictive alerts" 
      />

      {/* Overview Stats */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card p-6">
          <p className="text-xs uppercase tracking-widest text-ink-secondary">Overall Attendance</p>
          <p className="mt-3 font-display text-5xl font-bold text-lavender-dark">{overall}%</p>
        </div>

        <div className="card p-6">
          <p className="text-xs uppercase tracking-widest text-ink-secondary">At Risk Subjects</p>
          <p className="mt-3 font-display text-5xl font-bold text-coral">
            {ATTENDANCE_BY_SUBJECT.filter((r) => r.status !== "safe").length}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-xs uppercase tracking-widest text-ink-secondary">Classes This Week</p>
          <p className="mt-3 font-display text-5xl font-bold">18</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        
        {/* Attendance by Subject */}
        <div className="card p-6">
          <h4 className="mb-6 text-[15px] font-semibold text-ink-primary">Attendance by Subject</h4>
          
          <div className="space-y-6">
            {ATTENDANCE_BY_SUBJECT.map((record) => {
              const pct = Math.round((record.attended / record.total) * 100);
              return (
                <div key={record.subject} className="group">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium">{record.subject}</span>
                    <span className="text-ink-secondary dark:text-ink-secondary-dark">
                      {record.attended}/{record.total} • {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark">
                    <div 
                      className={`h-2.5 rounded-full transition-all ${STATUS_COLOR[record.status]}`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8-Week Trend */}
        <div className="card p-6">
          <h4 className="mb-6 text-[15px] font-semibold text-ink-primary">8-Week Trend</h4>
          
          <div className="flex h-52 items-end gap-3">
            {ATTENDANCE_TREND.map((v, i) => (
              <div 
                key={i} 
                className="flex-1 rounded-t-xl bg-gradient-to-t from-lavender-dark to-sky transition-all hover:brightness-110" 
                style={{ height: `${v}%` }}
              />
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-amber-50 dark:bg-amber-950/50 p-4 text-sm border border-amber-200 dark:border-amber-900">
            <p className="text-amber-700 dark:text-amber-400">
              Thermodynamics is trending below the 75% eligibility threshold. 
              Attend the next 3 sessions to recover.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}