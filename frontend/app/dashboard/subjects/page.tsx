import { IconUsers, IconCalendarCheck, IconArrowRight } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { SUBJECTS } from "@/lib/academic-data";

export default function SubjectsPage() {
  return (
    <>
      <PageHeader
        title="Subjects"
        subtitle="6 subjects enrolled this semester"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((subject) => (
          <a
            key={subject.id}
            href={`/dashboard/subjects/${subject.id}`}
            className="card group overflow-hidden transition-all hover:shadow-floating hover:-translate-y-0.5 duration-200"
          >
            {/* Header Gradient */}
            <div className={`h-24 bg-gradient-to-br ${subject.colorClass} relative`}>
              <div className="absolute bottom-3 right-3 rounded-full bg-white/90 dark:bg-black/70 px-2.5 py-0.5 text-[10px] font-mono tracking-widest text-ink-primary">
                {subject.credits} CR
              </div>
            </div>

            <div className="p-6">
              <h4 className="mb-3 text-[16px] font-semibold text-ink-primary leading-tight">
                {subject.name}
              </h4>

              <p className="mb-5 flex items-center gap-2 text-sm text-ink-secondary dark:text-ink-secondary-dark">
                <IconUsers size={16} className="text-lavender" />
                {subject.faculty}
              </p>

              {/* Progress */}
              <div className="mb-6">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-ink-secondary dark:text-ink-secondary-dark">Progress</span>
                  <span className="font-medium text-lavender-dark">{subject.progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-brand-gradient transition-all"
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer Info */}
              <div className="flex items-center justify-between border-t border-line pt-4 dark:border-line-dark">
                <div className="flex items-center gap-1.5 text-sm text-ink-secondary dark:text-ink-secondary-dark">
                  <IconCalendarCheck size={16} />
                  <span>{subject.attendance}% attendance</span>
                </div>

                <span className="flex items-center gap-1 text-sm font-medium text-lavender-dark group-hover:gap-1.5 transition-all">
                  View details
                  <IconArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}