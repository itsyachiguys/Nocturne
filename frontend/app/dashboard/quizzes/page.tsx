import { IconSparkles, IconAlertTriangle } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { QUIZ_HISTORY, WEAK_TOPICS } from "@/lib/ai-workspace-data";
import { SUBJECTS } from "@/lib/academic-data";

function scoreColor(score: number) {
  if (score >= 80) return "text-mint";
  if (score >= 60) return "text-pastel-orange";
  return "text-coral";
}

export default function QuizzesPage() {
  return (
    <>
      <PageHeader 
        title="Quizzes" 
        subtitle="Generate a quiz or review past attempts" 
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        
        <div className="space-y-6">
          
          {/* Create Quiz */}
          <div className="card p-6">
            <h4 className="mb-6 text-[15px] font-semibold text-ink-primary">Create a New Quiz</h4>
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark">Subject</span>
                <select className="mt-1 w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark">
                  {SUBJECTS.map((s) => (
                    <option key={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark">Difficulty</span>
                <select className="mt-1 w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark">
                  <option>Easy</option>
                  <option selected>Medium</option>
                  <option>Hard</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark">Number of Questions</span>
                <input type="number" defaultValue={10} className="mt-1 w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark" />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark">Timer (minutes)</span>
                <input type="number" defaultValue={15} className="mt-1 w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark" />
              </label>
            </div>

            <button className="btn-primary mt-6 w-full flex items-center justify-center gap-2 py-3">
              <IconSparkles size={18} />
              Generate Quiz
            </button>
          </div>

          {/* Quiz History */}
          <div className="card p-6">
            <h4 className="mb-5 text-[15px] font-semibold text-ink-primary">Quiz History</h4>
            <div className="divide-y divide-line dark:divide-line-dark">
              {QUIZ_HISTORY.map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-ink-primary">{quiz.title}</p>
                    <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{quiz.subject} • {quiz.date}</p>
                  </div>
                  <span className={`font-display text-xl font-bold ${scoreColor(quiz.score)}`}>
                    {quiz.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weak Topics */}
        <div className="card p-6 h-fit">
          <h4 className="mb-5 flex items-center gap-2 text-[15px] font-semibold text-ink-primary">
            <IconAlertTriangle size={18} className="text-pastel-orange" /> 
            AI-Flagged Weak Topics
          </h4>
          
          <div className="flex flex-col gap-3">
            {WEAK_TOPICS.map((topic, idx) => (
              <div key={idx} className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral border border-coral/20">
                {topic}
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-ink-secondary dark:text-ink-secondary-dark leading-relaxed">
            Future quizzes will be weighted toward these topics until your mastery improves.
          </p>
        </div>
      </div>
    </>
  );
}