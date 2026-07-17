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
      <PageHeader 
        title="Analytics" 
        subtitle="Preparation, retention, and predicted performance" 
      />

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ANALYTICS_METRICS.map((metric, idx) => (
          <div key={idx} className="card p-6 hover:shadow-soft transition-shadow">
            <p className="text-xs uppercase tracking-widest text-ink-secondary dark:text-ink-secondary-dark">
              {metric.label}
            </p>
            <p className="mt-3 font-display text-4xl font-bold text-ink-primary">
              {metric.value}
            </p>
            <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
              {metric.note}
            </p>
          </div>
        ))}
      </div>

      {/* Subject Strength */}
      <div className="card p-6">
        <h4 className="mb-6 text-[15px] font-semibold text-ink-primary">
          Subject Strength
        </h4>
        
        <div className="space-y-6">
          {SUBJECT_STRENGTH.map((s, idx) => (
            <div key={idx} className="group">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-ink-primary">{s.subject}</span>
                <span className="font-mono text-lavender-dark">{s.score}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${strengthColor(s.score)}`}
                  style={{ width: `${s.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}