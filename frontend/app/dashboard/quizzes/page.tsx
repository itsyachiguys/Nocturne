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
      <PageHeader title="Quizzes" subtitle="Generate a quiz or review past attempts" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="card mb-4 p-5">
            <h4 className="mb-4 text-[14.5px]">Create a quiz</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark">
                Subject
                <select className="mt-1 w-full rounded-sm border border-line bg-surface-bg px-3 py-2 text-sm text-ink-primary dark:border-line-dark dark:bg-surface-bg-dark dark:text-ink-primary-dark">
                  {SUBJECTS.map((s) => (
                    <option key={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark">
                Difficulty
                <select className="mt-1 w-full rounded-sm border border-line bg-surface-bg px-3 py-2 text-sm text-ink-primary dark:border-line-dark dark:bg-surface-bg-dark dark:text-ink-primary-dark">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark">
                Number of questions
                <input type="number" defaultValue={10} className="mt-1 w-full rounded-sm border border-line bg-surface-bg px-3 py-2 text-sm dark:border-line-dark dark:bg-surface-bg-dark" />
              </label>
              <label className="text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark">
                Timer (minutes)
                <input type="number" defaultValue={15} className="mt-1 w-full rounded-sm border border-line bg-surface-bg px-3 py-2 text-sm dark:border-line-dark dark:bg-surface-bg-dark" />
              </label>
            </div>
            <button className="btn-primary mt-4">
              <IconSparkles size={16} /> Generate quiz
            </button>
          </div>

          <div className="card p-5">
            <h4 className="mb-4 text-[14.5px]">Quiz history</h4>
            <div className="divide-y divide-line dark:divide-line-dark">
              {QUIZ_HISTORY.map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold">{quiz.title}</p>
                    <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{quiz.subject} · {quiz.date}</p>
                  </div>
                  <span className={`font-display font-bold ${scoreColor(quiz.score)}`}>{quiz.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h4 className="mb-4 flex items-center gap-2 text-[14.5px]">
            <IconAlertTriangle size={16} className="text-pastel-orange" /> AI-flagged weak topics
          </h4>
          <div className="flex flex-col gap-2">
            {WEAK_TOPICS.map((topic) => (
              <div key={topic} className="rounded-sm bg-coral/10 px-3 py-2.5 text-[13px] font-semibold text-coral">
                {topic}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-secondary dark:text-ink-secondary-dark">
            Quizzes are weighted toward these topics until your score improves.
          </p>
        </div>
      </div>
    </>
  );
}
