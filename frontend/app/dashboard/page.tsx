import Image from "next/image";
import Link from "next/link";

import {
  IconSchool,
  IconFlame,
  IconCalendarCheck,
  IconTargetArrow,
  IconClipboardList,
  IconUpload,
  IconNotes,
  IconHelpCircle,
  IconCalendarEvent,
  IconClock,
  IconBellRinging,
  IconSparkles,
} from "@tabler/icons-react";
import { Topbar } from "@/components/Topbar";
import { StatCard } from "@/components/StatCard";
import {
  DASHBOARD_STATS,
  UPCOMING_TASKS,
  LEADERBOARD,
  WEEKLY_STUDY_HOURS,
} from "@/lib/dashboard-data";

const STAT_ICON_STYLE = [
  { icon: IconSchool, bg: "bg-lavender/10", color: "text-lavender-dark" },
  { icon: IconFlame, bg: "bg-pastel-orange/10", color: "text-pastel-orange" },
  { icon: IconCalendarCheck, bg: "bg-sky/10", color: "text-sky" },
  { icon: IconTargetArrow, bg: "bg-coral/10", color: "text-coral" },
  { icon: IconClipboardList, bg: "bg-coral/10", color: "text-coral" },
];

const QUICK_ACTIONS = [
  { icon: IconUpload, label: "Upload PDF" },
  { icon: IconNotes, label: "Generate notes" },
  { icon: IconHelpCircle, label: "Generate quiz" },
  { icon: IconCalendarEvent, label: "Open planner" },
  { icon: IconClock, label: "View timetable" },
];

export default function DashboardPage() {
  return (
    <>
      <Topbar
        studentName="Aria"
        quote="Small steps, every night, compound into mastery."
      />

        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {DASHBOARD_STATS.map((stat, i) => (
            <StatCard
              key={stat.label}
              icon={STAT_ICON_STYLE[i].icon}
              iconBgClass={STAT_ICON_STYLE[i].bg}
              iconColorClass={STAT_ICON_STYLE[i].color}
              value={stat.value}
              label={stat.label}
              delta={stat.delta}
              deltaTone={stat.deltaTone}
            />
          ))}
        </div>

        <div className="mb-5 flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              className="card flex flex-1 min-w-[140px] flex-col gap-2.5 p-4 text-left transition-shadow hover:shadow-soft"
            >
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-sm bg-surface-alt text-lavender-dark dark:bg-surface-alt-dark">
                <action.icon size={18} stroke={1.75} />
              </div>
              <span className="text-[12.5px] font-semibold">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="card mb-4 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-[14.5px]">Weekly study hours</h4>
                <a href="/dashboard/analytics" className="text-xs font-semibold text-lavender-dark">
                  View analytics
                </a>
              </div>
              <div className="flex h-40 items-end gap-2">
                {WEEKLY_STUDY_HOURS.map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-gradient-to-b from-soft-purple to-lavender-dark" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-[14.5px]">Upcoming tasks</h4>
                <a href="/dashboard/planner" className="text-xs font-semibold text-lavender-dark">
                  Open planner
                </a>
              </div>
              {UPCOMING_TASKS.map((task) => (
                <div key={task.id} className="flex items-center gap-3 border-b border-line py-2.5 text-sm last:border-none dark:border-line-dark">
                  <div className="h-4.5 w-4.5 rounded-sm border-2 border-line dark:border-line-dark" />
                  <div>
                    <p>{task.title}</p>
                    <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">{task.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="card mb-4 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-[14.5px]">Leaderboard</h4>
                <a href="/dashboard/leaderboard" className="text-xs font-semibold text-lavender-dark">
                  See all
                </a>
              </div>
              {LEADERBOARD.map((entry) => (
                <div key={entry.rank} className="flex items-center gap-2.5 py-2 text-sm">
                  <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-surface-alt text-[11px] font-bold dark:bg-surface-alt-dark">
                    {entry.rank}
                  </div>
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-mint to-sky" />
                  <p className={`flex-1 ${entry.isCurrentUser ? "font-semibold" : ""}`}>{entry.name}</p>
                  <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{entry.points}</p>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-[14.5px]">Notifications</h4>
                <button className="text-xs font-semibold text-lavender-dark">Clear all</button>
              </div>
              <div className="flex gap-2.5 border-b border-line py-2.5 text-[12.5px] dark:border-line-dark">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-pastel-orange/10 text-pastel-orange">
                  <IconBellRinging size={14} />
                </div>
                <div>
                  <p className="font-semibold">Assignment due tomorrow</p>
                  <p className="text-ink-secondary dark:text-ink-secondary-dark">DSA — Assignment 4</p>
                </div>
              </div>
              <div className="flex gap-2.5 py-2.5 text-[12.5px]">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-lavender/10 text-lavender-dark">
                  <IconSparkles size={14} />
                </div>
                <div>
                  <p className="font-semibold">AI notes ready</p>
                  <p className="text-ink-secondary dark:text-ink-secondary-dark">Thermodynamics unit 3</p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
