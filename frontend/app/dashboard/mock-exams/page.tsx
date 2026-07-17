import { IconClipboardCheck, IconPlus } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { MOCK_EXAMS } from "@/lib/ai-workspace-data";

const STATUS_STYLE = {
  "not-started": { 
    label: "Not started", 
    bg: "bg-surface-alt dark:bg-surface-alt-dark", 
    text: "text-ink-secondary dark:text-ink-secondary-dark" 
  },
  "in-progress": { 
    label: "In progress", 
    bg: "bg-pastel-orange/10", 
    text: "text-pastel-orange" 
  },
  completed: { 
    label: "Completed", 
    bg: "bg-mint/10", 
    text: "text-mint" 
  },
} as const;

export default function MockExamsPage() {
  return (
    <>
      <PageHeader 
        title="Mock Exams" 
        subtitle="Full-length tests generated from your syllabus" 
        actionLabel="Generate mock test" 
        actionIcon={IconPlus} 
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_EXAMS.map((exam) => {
          const status = STATUS_STYLE[exam.status];
          return (
            <div key={exam.id} className="card p-6 group hover:shadow-soft transition-all">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lavender/10 text-lavender-dark">
                  <IconClipboardCheck size={22} />
                </div>
                
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>

              <h4 className="mb-2 text-[15px] font-semibold text-ink-primary group-hover:text-lavender-dark transition-colors">
                {exam.title}
              </h4>

              <p className="mb-6 text-sm text-ink-secondary dark:text-ink-secondary-dark">
                {exam.subject} • {exam.questions} questions • {exam.duration}
              </p>

              {exam.status === "completed" ? (
                <div className="font-display text-4xl font-bold text-mint">
                  {exam.score}%
                </div>
              ) : (
                <button className="btn-primary w-full py-3 text-sm font-medium">
                  {exam.status === "in-progress" ? "Resume Test" : "Start Test"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}