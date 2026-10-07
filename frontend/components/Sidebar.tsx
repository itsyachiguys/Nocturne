"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  IconChevronUp,
} from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";

// Resting the cursor on a menu item for this long opens its page.
// Set HOVER_OPENS_PAGE to false if you want click-only navigation.
const HOVER_OPENS_PAGE = true;
const HOVER_OPEN_DELAY_MS = 350;
const LOGOUT_HREF = "/logout"; // never opened by hovering
const PROFILE_HREF = "/dashboard/profile";
const SETTINGS_HREF = "/dashboard/settings";
const LOGOUT_CONFIRM_MS = 3000;

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

  // Account menu (opens from the user chip)
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [barRunning, setBarRunning] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);

  const activeHref =
    ALL_ITEMS.find((i) => isActive(pathname, i.href))?.href ?? null;
  // The highlight follows the cursor, and returns to the current page when you leave.
  const target = hoverHref ?? activeHref;

  const onProfile = isActive(pathname, PROFILE_HREF);
  const onSettings = isActive(pathname, SETTINGS_HREF);

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

  /* ---------------- Account menu behaviour ---------------- */

  const closeMenu = useCallback((returnFocus = false) => {
    setMenuOpen(false);
    setConfirmingLogout(false);
    if (returnFocus) chipRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen, closeMenu]);

  // Close when the page changes
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  // Move focus into the menu when it opens
  useEffect(() => {
    if (!menuOpen) return;
    const t = setTimeout(() => {
      menuRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"]')
        ?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [menuOpen]);

  // Log Out asks for a second click; it resets itself after a few seconds.
  useEffect(() => {
    if (!confirmingLogout) {
      setBarRunning(false);
      return;
    }
    setBarRunning(false);
    const raf = requestAnimationFrame(() => setBarRunning(true));
    const t = setTimeout(() => setConfirmingLogout(false), LOGOUT_CONFIRM_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [confirmingLogout]);

  function handleAccountKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && menuOpen) {
      e.preventDefault();
      closeMenu(true);
      return;
    }
    if (!menuOpen || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    if (items.length === 0) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown"
        ? items[(i + 1) % items.length]
        : items[(i - 1 + items.length) % items.length];
    next.focus();
  }

  function handleLogoutClick() {
    if (!confirmingLogout) {
      setConfirmingLogout(true);
      return;
    }
    closeMenu();
    router.push(LOGOUT_HREF);
  }

  const menuItemBase =
    "group/item flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-lavender-dark/50";
  const staggerStyle = (i: number): React.CSSProperties => ({
    transitionDelay: menuOpen ? `${70 + i * 45}ms` : "0ms",
  });
  const staggerClass = menuOpen
    ? "translate-y-0 opacity-100"
    : "translate-y-2 opacity-0";

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

        {/* Footer: user chip that opens the account menu */}
        <div className="shrink-0 border-t border-line p-3 dark:border-line-dark">
          <div
            ref={accountRef}
            className="relative"
            onKeyDown={handleAccountKeyDown}
          >
            {/* Popover (opens upward) */}
            <div
              ref={menuRef}
              role="menu"
              aria-label="Account menu"
              aria-hidden={!menuOpen}
              className={`absolute bottom-full left-0 right-0 z-50 mb-3 origin-bottom rounded-2xl border border-line bg-surface-card p-2 shadow-soft transition-all duration-200 ease-out dark:border-line-dark dark:bg-surface-card-dark ${
                menuOpen
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none translate-y-2 scale-95 opacity-0"
              }`}
            >
              {/* Glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-8 left-1/2 h-20 w-36 -translate-x-1/2 rounded-full bg-lavender/30 blur-3xl"
              />

              {/* Header card */}
              <div className="relative mb-2 flex items-center gap-3 overflow-hidden rounded-xl bg-surface-alt p-3 dark:bg-surface-alt-dark">
                <div className="rounded-full bg-brand-gradient p-[2px]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-sm font-bold text-ink-primary dark:bg-surface-card-dark dark:text-ink-primary-dark">
                    {initials}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-primary dark:text-ink-primary-dark">
                    {name}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-ink-muted dark:text-ink-muted-dark">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Student · online
                  </p>
                </div>
              </div>

              {/* Profile */}
              <Link
                href={PROFILE_HREF}
                role="menuitem"
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => closeMenu()}
                style={staggerStyle(0)}
                className={`${menuItemBase} ${staggerClass} ${
                  onProfile
                    ? "bg-surface-alt text-ink-primary dark:bg-surface-alt-dark dark:text-ink-primary-dark"
                    : "text-ink-secondary hover:bg-surface-alt focus-visible:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-surface-alt-dark dark:focus-visible:bg-surface-alt-dark"
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lavender/20 text-lavender-dark transition-transform duration-200 group-hover/item:-rotate-6 group-hover/item:scale-110">
                  <IconUser size={17} stroke={1.8} />
                </span>
                <span className="flex-1">Profile</span>
                {onProfile && (
                  <span className="h-1.5 w-1.5 rounded-full bg-lavender-dark" />
                )}
              </Link>

              {/* Settings */}
              <Link
                href={SETTINGS_HREF}
                role="menuitem"
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => closeMenu()}
                style={staggerStyle(1)}
                className={`${menuItemBase} ${staggerClass} ${
                  onSettings
                    ? "bg-surface-alt text-ink-primary dark:bg-surface-alt-dark dark:text-ink-primary-dark"
                    : "text-ink-secondary hover:bg-surface-alt focus-visible:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-surface-alt-dark dark:focus-visible:bg-surface-alt-dark"
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky/20 text-ink-secondary transition-transform duration-200 group-hover/item:rotate-90 dark:text-ink-secondary-dark">
                  <IconSettings size={17} stroke={1.8} />
                </span>
                <span className="flex-1">Settings</span>
                {onSettings && (
                  <span className="h-1.5 w-1.5 rounded-full bg-lavender-dark" />
                )}
              </Link>

              <div className="my-1.5 h-px bg-gradient-to-r from-transparent via-line to-transparent dark:via-line-dark" />

              {/* Log out (two-step confirm) */}
              <button
                type="button"
                role="menuitem"
                tabIndex={menuOpen ? 0 : -1}
                onClick={handleLogoutClick}
                style={staggerStyle(2)}
                className={`${menuItemBase} ${staggerClass} ${
                  confirmingLogout
                    ? "bg-[#e5484d]/15 text-[#e5484d]"
                    : "text-[#e5484d] hover:bg-[#e5484d]/10 focus-visible:bg-[#e5484d]/10"
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e5484d]/15 transition-transform duration-200 group-hover/item:translate-x-0.5">
                  <IconLogout size={17} stroke={1.8} />
                </span>
                <span className="flex-1">
                  {confirmingLogout ? "Click again to log out" : "Log Out"}
                </span>
                {confirmingLogout && (
                  <span className="h-1 w-8 overflow-hidden rounded-full bg-[#e5484d]/20">
                    <span
                      className={`block h-full w-full origin-left bg-[#e5484d] ease-linear transition-transform ${
                        barRunning ? "scale-x-0" : "scale-x-100"
                      }`}
                      style={{
                        transitionDuration: `${LOGOUT_CONFIRM_MS}ms`,
                      }}
                    />
                  </span>
                )}
              </button>
            </div>

            {/* User chip (trigger) */}
            <button
              ref={chipRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((o) => !o);
                setConfirmingLogout(false);
              }}
              className={`group flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-lavender-dark/50 ${
                menuOpen
                  ? "border-lavender-dark/40 bg-surface-alt shadow-soft dark:bg-surface-alt-dark"
                  : "border-transparent bg-surface-alt hover:shadow-soft dark:bg-surface-alt-dark"
              }`}
            >
              <span className="rounded-full bg-brand-gradient p-[2px] transition-transform duration-300 group-hover:rotate-12">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-card text-[11px] font-bold text-ink-primary dark:bg-surface-card-dark dark:text-ink-primary-dark">
                  {initials}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink-primary dark:text-ink-primary-dark">
                  {name}
                </span>
                <span className="block text-[11px] text-ink-muted dark:text-ink-muted-dark">
                  Student
                </span>
              </span>
              <IconChevronUp
                size={18}
                className={`text-ink-muted transition-transform duration-300 dark:text-ink-muted-dark ${
                  menuOpen ? "rotate-180" : "group-hover:-translate-y-0.5"
                }`}
              />
              {onProfile || onSettings ? (
                <span className="sr-only">Account pages open</span>
              ) : null}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}