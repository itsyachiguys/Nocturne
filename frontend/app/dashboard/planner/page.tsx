import { IconPlus, IconPlayerPlay } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { PLANNER_TASKS, WEEKLY_GOAL } from "@/lib/planning-data";

export default function PlannerPage() {
  const goalPct = Math.round((WEEKLY_GOAL.completed / WEEKLY_GOAL.target) * 100);

  return (
    <>
      <PageHeader title="Planner" subtitle="Today's tasks and weekly goals" actionLabel="Add task" actionIcon={IconPlus} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5">
          <h4 className="mb-4 text-[14.5px]">Today</h4>
          {PLANNER_TASKS.map((task) => (
            <div key={task.id} className="flex items-center gap-3 border-b border-line py-3 text-sm last:border-none dark:border-line-dark">
              <div
                className={`h-4.5 w-4.5 flex-shrink-0 rounded-sm border-2 ${
                  task.done ? "border-mint bg-mint" : "border-line dark:border-line-dark"
                }`}
              />
              <div className={task.done ? "flex-1 opacity-50 line-through" : "flex-1"}>
                <p>{task.title}</p>
                <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">{task.subject} · {task.due}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="card mb-4 p-5">
            <h4 className="mb-3 text-[14.5px]">Weekly goal</h4>
            <div className="mb-2 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-extrabold">{WEEKLY_GOAL.completed}</span>
              <span className="text-sm text-ink-secondary dark:text-ink-secondary-dark">/ {WEEKLY_GOAL.target} tasks</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark">
              <div className="h-1.5 rounded-full bg-brand-gradient" style={{ width: `${goalPct}%` }} />
            </div>
          </div>

          <div className="card p-5 text-center">
            <h4 className="mb-3 text-[14.5px]">Pomodoro</h4>
            <p className="font-display text-4xl font-extrabold">25:00</p>
            <p className="mb-4 text-xs text-ink-secondary dark:text-ink-secondary-dark">Focus session</p>
            <button className="btn-primary mx-auto">
              <IconPlayerPlay size={16} /> Start
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
