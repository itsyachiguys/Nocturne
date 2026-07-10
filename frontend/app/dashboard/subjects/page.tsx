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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((subject) => (
          <a
            key={subject.id}
            href={`/dashboard/subjects/${subject.id}`}
            className="card group overflow-hidden transition-shadow hover:shadow-floating"
          >
            <div className={`h-20 bg-gradient-to-br ${subject.colorClass}`} />
            <div className="p-5">
              <h4 className="mb-1 text-[15px]">{subject.name}</h4>
              <p className="mb-4 flex items-center gap-1.5 text-xs text-ink-secondary dark:text-ink-secondary-dark">
                <IconUsers size={14} /> {subject.faculty} · {subject.credits} credits
              </p>

              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-xs text-ink-secondary dark:text-ink-secondary-dark">
                  <span>Course progress</span>
                  <span>{subject.progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark">
                  <div
                    className="h-1.5 rounded-full bg-brand-gradient"
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-3 text-xs dark:border-line-dark">
                <span className="flex items-center gap-1.5 text-ink-secondary dark:text-ink-secondary-dark">
                  <IconCalendarCheck size={14} /> {subject.attendance}% attendance
                </span>
                <span className="flex items-center gap-1 font-semibold text-lavender-dark transition-transform group-hover:translate-x-0.5">
                  Open <IconArrowRight size={13} />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
