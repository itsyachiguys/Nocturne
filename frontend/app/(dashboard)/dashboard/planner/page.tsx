import { IconPlus, IconPlayerPlay, IconCheck } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { PLANNER_TASKS, WEEKLY_GOAL } from "@/lib/planning-data";

export default function PlannerPage() {
  const goalPct = Math.round((WEEKLY_GOAL.completed / WEEKLY_GOAL.target) * 100);

  return (
    <>
      <PageHeader 
        title="Planner" 
        subtitle="Today's tasks and weekly goals" 
        actionLabel="Add task" 
        actionIcon={IconPlus} 
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        
        {/* Today's Tasks */}
        <div className="card p-6">
          <h4 className="mb-6 text-[15px] font-semibold text-ink-primary">Today’s Tasks</h4>
          
          <div className="space-y-4">
            {PLANNER_TASKS.map((task) => (
              <div 
                key={task.id} 
                className="flex items-start gap-4 border-b border-line pb-4 last:border-none dark:border-line-dark"
              >
                <div
                  className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                    task.done 
                      ? "border-mint bg-mint" 
                      : "border-line dark:border-line-dark hover:border-lavender"
                  }`}
                >
                  {task.done && <IconCheck size={14} className="text-white" />}
                </div>
                
                <div className={`flex-1 ${task.done ? "opacity-60 line-through" : ""}`}>
                  <p className="text-[15px]">{task.title}</p>
                  <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark mt-0.5">
                    {task.subject} • Due {task.due}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Weekly Goal */}
          <div className="card p-6">
            <h4 className="mb-5 text-[15px] font-semibold text-ink-primary">Weekly Goal</h4>
            
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-display text-4xl font-bold text-lavender-dark">
                {WEEKLY_GOAL.completed}
              </span>
              <span className="text-xl text-ink-secondary">/ {WEEKLY_GOAL.target}</span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark mb-2">
              <div 
                className="h-2.5 rounded-full bg-brand-gradient" 
                style={{ width: `${goalPct}%` }} 
              />
            </div>
            <p className="text-xs text-ink-secondary">{goalPct}% completed</p>
          </div>

          {/* Pomodoro Timer */}
          <div className="card p-6 text-center">
            <h4 className="mb-2 text-[15px] font-semibold text-ink-primary">Pomodoro Timer</h4>
            <p className="font-display text-6xl font-bold tracking-tighter text-lavender-dark mb-2">25:00</p>
            <p className="text-sm text-ink-secondary mb-6">Focus Session</p>
            
            <button className="btn-primary mx-auto flex items-center gap-2 px-8 py-3">
              <IconPlayerPlay size={18} />
              Start Focus
            </button>
          </div>
        </div>
      </div>
    </>
  );
}