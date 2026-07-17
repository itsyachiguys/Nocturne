"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
} from "@tabler/icons-react";

interface NavItem {
  label: string;
  href: string;
  icon: typeof IconLayoutDashboard;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
      { label: "Subjects", href: "/dashboard/subjects", icon: IconBook2 },
      { label: "Study Material", href: "/dashboard/materials", icon: IconFolder },
    ],
  },
  {
    label: "AI Workspace",
    items: [
      { label: "Notes", href: "/dashboard/notes", icon: IconNotes },
      { label: "Flashcards", href: "/dashboard/flashcards", icon: IconCards },
      { label: "Quizzes", href: "/dashboard/quizzes", icon: IconHelpCircle },
      { label: "Mock Exams", href: "/dashboard/mock-exams", icon: IconClipboardCheck },
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
      { label: "Log Out", href: "/logout", icon: IconLogout },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] flex-shrink-0 flex-col border-r border-line bg-surface-card p-5 dark:border-line-dark dark:bg-surface-card-dark">

      {/* ---------- Brand ---------- */}
      <div className="mb-8 flex items-center gap-3 px-2">

        <div className="h-12 w-12 overflow-hidden rounded-full bg-white shadow-md">
          <Image
            src="/Logo.png"
            alt="Nocturne Logo"
            width={48}
            height={48}
            priority
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-primary dark:text-ink-primary-dark">
            Nocturne
          </h1>

          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
            AI Learning Platform
          </p>
        </div>

      </div>

      {/* ---------- Navigation ---------- */}
      <div className="flex-1 overflow-y-auto">

        {NAV_GROUPS.map((group) => (
          <div key={group.label ?? "primary"} className="mb-5">

            {group.label && (
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
                {group.label}
              </p>
            )}

            <div className="space-y-1">

              {group.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-brand-gradient text-white shadow-soft"
                        : "text-ink-secondary hover:bg-surface-alt hover:text-ink-primary dark:text-ink-secondary-dark dark:hover:bg-surface-alt-dark dark:hover:text-white"
                    }`}
                  >
                    <item.icon size={20} stroke={1.8} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

            </div>

          </div>
        ))}

      </div>

    </aside>
  );
}