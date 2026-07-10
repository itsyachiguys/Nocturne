import { IconClipboardCheck, IconPlus } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { MOCK_EXAMS } from "@/lib/ai-workspace-data";

const STATUS_STYLE = {
  "not-started": { label: "Not started", bg: "bg-surface-alt dark:bg-surface-alt-dark", text: "text-ink-secondary dark:text-ink-secondary-dark" },
  "in-progress": { label: "In progress", bg: "bg-pastel-orange/10", text: "text-pastel-orange" },
  completed: { label: "Completed", bg: "bg-mint/10", text: "text-mint" },
} as const;

export default function MockExamsPage() {
  return (
    <>
      <PageHeader title="Mock exams" subtitle="Full-length tests generated from your syllabus" actionLabel="Generate mock test" actionIcon={IconPlus} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_EXAMS.map((exam) => {
          const status = STATUS_STYLE[exam.status];
          return (
            <div key={exam.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-lavender/10 text-lavender-dark">
                  <IconClipboardCheck size={18} />
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
              <h4 className="mb-1 text-[14.5px]">{exam.title}</h4>
              <p className="mb-4 text-xs text-ink-secondary dark:text-ink-secondary-dark">
                {exam.subject} · {exam.questions} questions · {exam.duration}
              </p>
              {exam.status === "completed" ? (
                <p className="font-display text-lg font-bold text-mint">{exam.score}% score</p>
              ) : (
                <button className="btn-ghost w-full justify-center py-2 text-xs">
                  {exam.status === "in-progress" ? "Resume" : "Start test"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
