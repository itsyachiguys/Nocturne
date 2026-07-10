import { notFound } from "next/navigation";
import { IconNotes, IconCards, IconHelpCircle, IconFileText } from "@tabler/icons-react";
import { SUBJECTS } from "@/lib/academic-data";

const UNITS = [
  { title: "Unit 1 — Foundations", progress: 100 },
  { title: "Unit 2 — Core concepts", progress: 85 },
  { title: "Unit 3 — Applied problems", progress: 55 },
  { title: "Unit 4 — Advanced topics", progress: 10 },
];

const TOOLS = [
  { icon: IconNotes, label: "AI notes" },
  { icon: IconCards, label: "Flashcards" },
  { icon: IconHelpCircle, label: "MCQs" },
  { icon: IconFileText, label: "Assignments" },
];

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const subject = SUBJECTS.find((s) => s.id === params.id);
  if (!subject) return notFound();

  return (
    <>
      <div className={`mb-6 -mx-8 -mt-6 h-32 bg-gradient-to-br ${subject.colorClass}`} />
      <div className="mb-6 -mt-16 px-1">
        <div className="card inline-block px-6 py-4">
          <h2 className="text-xl">{subject.name}</h2>
          <p className="text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
            {subject.faculty} · {subject.credits} credits · {subject.attendance}% attendance
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {TOOLS.map((tool) => (
          <button
            key={tool.label}
            className="card flex items-center gap-2 px-4 py-3 text-[13px] font-semibold transition-shadow hover:shadow-soft"
          >
            <tool.icon size={16} className="text-lavender-dark" />
            {tool.label}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <h4 className="mb-4 text-[14.5px]">Units</h4>
        {UNITS.map((unit) => (
          <div key={unit.title} className="border-b border-line py-3 last:border-none dark:border-line-dark">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span>{unit.title}</span>
              <span className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{unit.progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark">
              <div className="h-1.5 rounded-full bg-brand-gradient" style={{ width: `${unit.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
