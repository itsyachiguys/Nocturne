"use client";

import {
  IconLayoutDashboard,
  IconBook2,
  IconFolder,
  IconNotes,
  IconCards,
  IconHelpCircle,
  IconClipboardCheck,
  IconCalendarCheck,
  IconCalendarEvent,
  IconClock,
  IconChartLine,
  IconTrophy,
  IconUser,
  IconSettings,
  IconLogout,
  IconMoonStars,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
  icon: typeof IconLayoutDashboard;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

// Sidebar is data-driven so adding a new destination is a one-line
// change here rather than editing markup in three places.
const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
      { label: "Subjects", href: "/dashboard/subjects", icon: IconBook2 },
      { label: "Study material", href: "/dashboard/materials", icon: IconFolder },
    ],
  },
  {
    label: "AI workspace",
    items: [
      { label: "Notes", href: "/dashboard/notes", icon: IconNotes },
      { label: "Flashcards", href: "/dashboard/flashcards", icon: IconCards },
      { label: "Quizzes", href: "/dashboard/quizzes", icon: IconHelpCircle },
      { label: "Mock exams", href: "/dashboard/mock-exams", icon: IconClipboardCheck },
    ],
  },
  {
    label: "Planning",
    items: [
      { label: "Attendance", href: "/dashboard/attendance", icon: IconCalendarCheck },
      { label: "Planner", href: "/dashboard/planner", icon: IconCalendarEvent },
      { label: "Timetable", href: "/dashboard/timetable", icon: IconClock },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/dashboard/analytics", icon: IconChartLine },
      { label: "Leaderboard", href: "/dashboard/leaderboard", icon: IconTrophy },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/dashboard/profile", icon: IconUser },
      { label: "Settings", href: "/dashboard/settings", icon: IconSettings },
      { label: "Log out", href: "/logout", icon: IconLogout },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[250px] flex-shrink-0 flex-col gap-1 border-r border-line bg-surface-card p-4 dark:border-line-dark dark:bg-surface-card-dark">
      <div className="mb-6 flex items-center px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-gradient text-white">
          <IconMoonStars size={18} />
        </div>
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.label ?? "primary"}>
          {group.label && (
            <p className="mb-1.5 mt-4 px-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${
                  isActive
                    ? "bg-brand-gradient text-white shadow-soft"
                    : "text-ink-secondary hover:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-surface-alt-dark"
                }`}
              >
                <item.icon size={18} stroke={1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}