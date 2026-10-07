"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconChevronUp,
  IconClockHour4,
  IconFlame,
  IconLogout,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";

type AccountMenuProps = {
  name: string;
  role?: string;
  /** Called after the user confirms Log Out (second click). */
  onLogout: () => void | Promise<void>;
  /** Optional mini stats shown in the popover header. */
  stats?: { streakDays?: number; focusMinutesToday?: number };
  profileHref?: string;
  settingsHref?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function AccountMenu({
  name,
  role = "Student",
  onLogout,
  stats,
  profileHref = "/dashboard/profile",
  settingsHref = "/dashboard/settings",
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    setConfirmingLogout(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);

  // Close when the route changes
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Logout confirmation resets itself after 3s
  useEffect(() => {
    if (!confirmingLogout) return;
    const t = setTimeout(() => setConfirmingLogout(false), 3000);
    return () => clearTimeout(t);
  }, [confirmingLogout]);

  // Keyboard: Esc closes, arrows move between items
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
      return;
    }
    if (!open) return;
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    if (items.length === 0) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown"
        ? items[(i + 1) % items.length]
        : items[(i - 1 + items.length) % items.length];
    next.focus();
  };

  // Focus first item when opened via keyboard/click
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
      }, 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  const onProfile = pathname === profileHref;
  const onSettings = pathname === settingsHref;

  const itemBase =
    "group/item relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-violet-400/60";

  const itemStyle = (i: number): React.CSSProperties => ({
    transitionDelay: open ? `${70 + i * 45}ms` : "0ms",
  });
  const itemAnim = open
    ? "translate-y-0 opacity-100"
    : "translate-y-2 opacity-0";

  return (
    <div ref={wrapRef} className="relative" onKeyDown={onKeyDown}>
      {/* ---------- Popover (opens upward) ---------- */}
      <div
        ref={panelRef}
        role="menu"
        aria-label="Account menu"
        aria-hidden={!open}
        className={[
          "absolute bottom-full left-0 right-0 z-50 mb-3 origin-bottom-left",
          "rounded-2xl border border-white/10 bg-[#1b1630]/95 p-2 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl",
          "transition-all duration-200 ease-out",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0",
        ].join(" ")}
      >
        {/* soft glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 h-24 w-40 -translate-x-1/2 rounded-full bg-violet-500/25 blur-3xl"
        />

        {/* Header card */}
        <div className="relative mb-2 overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/25 via-indigo-500/10 to-transparent p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-tr from-violet-400 via-sky-300 to-fuchsia-400 p-[2px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b1630] text-sm font-bold text-white">
                {initials(name)}
              </div>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{name}</p>
              <p className="flex items-center gap-1.5 text-xs text-white/55">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {role} · online
              </p>
            </div>
          </div>

          {stats && (stats.streakDays !== undefined || stats.focusMinutesToday !== undefined) && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {stats.streakDays !== undefined && (
                <div className="flex items-center gap-2 rounded-lg bg-black/25 px-2.5 py-1.5">
                  <IconFlame size={16} className="text-orange-300" />
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-white">{stats.streakDays} day{stats.streakDays === 1 ? "" : "s"}</p>
                    <p className="text-[10px] text-white/45">streak</p>
                  </div>
                </div>
              )}
              {stats.focusMinutesToday !== undefined && (
                <div className="flex items-center gap-2 rounded-lg bg-black/25 px-2.5 py-1.5">
                  <IconClockHour4 size={16} className="text-sky-300" />
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-white">{stats.focusMinutesToday} min</p>
                    <p className="text-[10px] text-white/45">focused today</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <Link
          href={profileHref}
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={() => close()}
          style={itemStyle(0)}
          className={`${itemBase} ${itemAnim} ${
            onProfile ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/8 hover:text-white focus-visible:bg-white/8"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200 transition-transform duration-200 group-hover/item:scale-110 group-hover/item:rotate-[-6deg]">
            <IconUser size={17} />
          </span>
          <span className="flex-1">Profile</span>
          {onProfile && <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />}
        </Link>

        {/* Settings */}
        <Link
          href={settingsHref}
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={() => close()}
          style={itemStyle(1)}
          className={`${itemBase} ${itemAnim} ${
            onSettings ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/8 hover:text-white focus-visible:bg-white/8"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400/15 text-sky-200 transition-transform duration-200 group-hover/item:scale-110 group-hover/item:rotate-90">
            <IconSettings size={17} />
          </span>
          <span className="flex-1">Settings</span>
          {onSettings && <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />}
        </Link>

        <div className="my-1.5 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Log out (two-step confirm) */}
        <button
          type="button"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          style={itemStyle(2)}
          onClick={async () => {
            if (!confirmingLogout) {
              setConfirmingLogout(true);
              return;
            }
            close();
            await onLogout();
          }}
          className={`${itemBase} ${itemAnim} ${
            confirmingLogout
              ? "bg-rose-500/20 text-rose-100"
              : "text-rose-200/80 hover:bg-rose-500/10 hover:text-rose-100 focus-visible:bg-rose-500/10"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-400/15 text-rose-200 transition-transform duration-200 group-hover/item:translate-x-0.5">
            <IconLogout size={17} />
          </span>
          <span className="flex-1">{confirmingLogout ? "Click again to log out" : "Log Out"}</span>
          {confirmingLogout && (
            <span className="h-1 w-8 overflow-hidden rounded-full bg-rose-300/20">
              <span className="block h-full w-full origin-left animate-[shrink_3s_linear_forwards] bg-rose-300" />
            </span>
          )}
        </button>
      </div>

      {/* ---------- User chip (trigger) ---------- */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setConfirmingLogout(false);
        }}
        className={[
          "group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left outline-none transition-all duration-200",
          "focus-visible:ring-2 focus-visible:ring-violet-400/60",
          open
            ? "border-violet-400/40 bg-white/10 shadow-[0_0_0_4px_rgba(139,92,246,0.12)]"
            : "border-white/5 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.08]",
        ].join(" ")}
      >
        <div className="rounded-full bg-gradient-to-tr from-violet-400 via-sky-300 to-fuchsia-400 p-[2px] transition-transform duration-300 group-hover:rotate-12">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1b1630] text-xs font-bold text-white">
            {initials(name)}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <p className="truncate text-xs text-white/50">{role}</p>
        </div>
        <IconChevronUp
          size={18}
          className={`text-white/50 transition-transform duration-300 ${open ? "rotate-180 text-white/80" : "group-hover:-translate-y-0.5"}`}
        />
      </button>

      {/* keyframes for the log-out countdown bar */}
      <style jsx global>{`
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
}