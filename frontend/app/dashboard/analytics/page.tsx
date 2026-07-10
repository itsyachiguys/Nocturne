import { PageHeader } from "@/components/PageHeader";
import { ANALYTICS_METRICS, SUBJECT_STRENGTH } from "@/lib/planning-data";

function strengthColor(score: number) {
  if (score >= 75) return "bg-mint";
  if (score >= 55) return "bg-pastel-orange";
  return "bg-coral";
}

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="Preparation, retention, and predicted performance" />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ANALYTICS_METRICS.map((metric) => (
          <div key={metric.label} className="card p-5">
            <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{metric.label}</p>
            <p className="font-display text-2xl font-extrabold">{metric.value}</p>
            <p className="mt-1.5 text-[11px] text-ink-muted dark:text-ink-muted-dark">{metric.note}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h4 className="mb-4 text-[14.5px]">Strong and weak subjects</h4>
        {SUBJECT_STRENGTH.map((s) => (
          <div key={s.subject} className="border-b border-line py-3 last:border-none dark:border-line-dark">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span>{s.subject}</span>
              <span className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{s.score}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark">
              <div className={`h-1.5 rounded-full ${strengthColor(s.score)}`} style={{ width: `${s.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
