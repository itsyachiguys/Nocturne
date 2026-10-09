"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  IconLayoutDashboard,
  IconBook2,
  IconFolder,
  IconNotes,
  IconCards,
  IconHelpCircle,
  IconCalendarCheck,
  IconCalendarEvent,
  IconClock,
  IconChartLine,
  IconTrophy,
  IconUser,
  IconSettings,
  IconBriefcase,
  IconLogout,
} from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";

// Resting the cursor on a menu item for this long opens its page.
// Set HOVER_OPENS_PAGE to false if you want click-only navigation.
const HOVER_OPENS_PAGE = true;
const HOVER_OPEN_DELAY_MS = 350;
const LOGOUT_HREF = "/logout"; // never opened by hovering

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
    label: "Career",
    items: [
      { label: "Obliqo", href: "/dashboard/obliqo", icon: IconBriefcase },
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
      { label: "Log Out", href: LOGOUT_HREF, icon: IconLogout },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

// "/dashboard" must match exactly, otherwise it would be active on every page.
function isActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  const [hoverHref, setHoverHref] = useState<string | null>(null);
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);
  const [animate, setAnimate] = useState(false);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeHref =
    ALL_ITEMS.find((i) => isActive(pathname, i.href))?.href ?? null;
  // The highlight follows the cursor, and returns to the current page when you leave.
  const target = hoverHref ?? activeHref;

  const name = profile?.name ?? "Student";
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "S";

  function clearOpenTimer() {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }

  // Don't leave a pending navigation behind when the sidebar unmounts.
  useEffect(() => clearOpenTimer, []);

  function handleEnter(item: NavItem) {
    setHoverHref(item.href);
    clearOpenTimer();
    if (item.href === LOGOUT_HREF) return;
    router.prefetch(item.href);
    if (HOVER_OPENS_PAGE && !isActive(pathname, item.href)) {
      openTimer.current = setTimeout(
        () => router.push(item.href),
        HOVER_OPEN_DELAY_MS
      );
    }
  }

  function handleLeaveNav() {
    setHoverHref(null);
    clearOpenTimer();
  }

  // Measure the target item so the highlight can slide to it.
  useEffect(() => {
    const measure = () => {
      const el = target ? itemRefs.current[target] : null;
      if (el) setPill({ top: el.offsetTop, height: el.offsetHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [target]);

  // Turn animation on only after the first position is set, so it doesn't slide in from the top on load.
  useEffect(() => {
    if (!pill || animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [pill, animate]);

  return (
    <aside className="relative z-10 flex h-full w-[260px] shrink-0 flex-col overflow-hidden rounded-3xl border border-line bg-surface-card shadow-soft dark:border-line-dark dark:bg-surface-card-dark">
      {/* Soft colour glows behind the content */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-16 h-48 w-48 rounded-full bg-lavender/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-12 h-44 w-44 rounded-full bg-sky/20 blur-3xl"
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        {/* Header: fixed height so the logo never moves */}
        <div className="flex h-[88px] shrink-0 items-center border-b border-line px-5 dark:border-line-dark">
          <BrandLogo />
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative" onMouseLeave={handleLeaveNav}>
            {/* Sliding highlight */}
            <div
              aria-hidden
              className={`pointer-events-none absolute left-0 right-0 top-0 rounded-2xl bg-brand-gradient shadow-soft motion-reduce:transition-none ${
                animate
                  ? "transition-[transform,height,opacity] duration-300 ease-out"
                  : ""
              } ${pill && target ? "opacity-100" : "opacity-0"}`}
              style={{
                height: pill?.height ?? 0,
                transform: `translateY(${pill?.top ?? 0}px)`,
              }}
            />

            {NAV_GROUPS.map((group) => (
              <div key={group.label ?? "primary"} className="mb-5">
                {group.label && (
                  <div className="mb-2 flex items-center gap-2 px-3">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-muted dark:text-ink-muted-dark">
                      {group.label}
                    </p>
                    <span className="h-px flex-1 bg-line dark:bg-line-dark" />
                  </div>
                )}

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isTarget = target === item.href;
                    const isCurrent = activeHref === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        ref={(el) => {
                          itemRefs.current[item.href] = el;
                        }}
                        onMouseEnter={() => handleEnter(item)}
                        onFocus={() => setHoverHref(item.href)}
                        onBlur={() => setHoverHref(null)}
                        onClick={clearOpenTimer}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`relative z-10 flex items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-medium transition-colors duration-200 ${
                          isTarget
                            ? "text-white"
                            : "text-ink-secondary dark:text-ink-secondary-dark"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
                            isTarget
                              ? "bg-white/20"
                              : "bg-surface-alt dark:bg-surface-alt-dark"
                          }`}
                        >
                          <item.icon size={18} stroke={1.8} />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {isCurrent && (
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isTarget ? "bg-white" : "bg-lavender-dark"
                            }`}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer: who's signed in */}
        <div className="shrink-0 border-t border-line p-3 dark:border-line-dark">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 rounded-2xl bg-surface-alt p-2.5 transition-shadow hover:shadow-soft dark:bg-surface-alt-dark"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-ink-primary dark:text-ink-primary-dark">
                {name}
              </span>
              <span className="block text-[11px] text-ink-muted dark:text-ink-muted-dark">
                Student
              </span>
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
