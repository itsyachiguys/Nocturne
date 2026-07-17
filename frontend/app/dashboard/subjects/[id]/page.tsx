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
  { icon: IconNotes, label: "AI Notes" },
  { icon: IconCards, label: "Flashcards" },
  { icon: IconHelpCircle, label: "Practice MCQs" },
  { icon: IconFileText, label: "Assignments" },
];

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const subject = SUBJECTS.find((s) => s.id === params.id);
  if (!subject) return notFound();

  return (
    <>
      {/* Hero Banner */}
      <div className={`-mx-8 -mt-6 h-40 bg-gradient-to-br ${subject.colorClass} relative`}>
        <div className="absolute -bottom-8 left-8">
          <div className="card inline-block px-8 py-5 shadow-soft">
            <h1 className="text-2xl font-semibold text-ink-primary">{subject.name}</h1>
            <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
              {subject.faculty} • {subject.credits} credits • {subject.attendance}% attendance
            </p>
          </div>
        </div>
      </div>

      <div className="pt-12">
        {/* Quick Tools */}
        <div className="mb-10 flex flex-wrap gap-3">
          {TOOLS.map((tool) => (
            <button
              key={tool.label}
              className="card flex items-center gap-3 px-6 py-4 text-sm font-medium hover:shadow-soft transition-all active:scale-[0.985]"
            >
              <tool.icon size={20} className="text-lavender-dark" />
              {tool.label}
            </button>
          ))}
        </div>

        {/* Units Progress */}
        <div className="card p-6">
          <h3 className="mb-6 text-[15px] font-semibold text-ink-primary">Course Units</h3>
          
          <div className="space-y-6">
            {UNITS.map((unit, idx) => (
              <div key={idx}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{unit.title}</span>
                  <span className="text-lavender-dark font-medium">{unit.progress}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark overflow-hidden">
                  <div 
                    className="h-2.5 rounded-full bg-brand-gradient transition-all" 
                    style={{ width: `${unit.progress}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}