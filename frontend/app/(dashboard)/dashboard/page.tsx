"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

import {
  IconSchool,
  IconFlame,
  IconClockHour4,
  IconTargetArrow,
  IconClipboardList,
  IconUpload,
  IconNotes,
  IconHelpCircle,
  IconCalendarEvent,
  IconClock,
  IconBellRinging,
  IconBellOff,
  IconSparkles,
  IconPlayerPlay,
  IconPlus,
  IconCheck,
  IconArrowRight,
  IconX,
  IconCrown,
  IconBrain,
  IconSunHigh,
  IconSunset2,
  IconMoon,
  IconRocket,
  IconTrophy,
  IconMedal,
  IconBolt,
  IconLock,
} from "@tabler/icons-react";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { LEADERBOARD } from "@/lib/dashboard-data";
import { SUBJECTS } from "@/lib/academic-data";
import LifeScoreCard from "@/components/lifescore/LifeScoreCard";

import {
  addTask,
  setTaskDone,
  subscribeFocusSessions,
  subscribeTasks,
  subscribeWeeklyTarget,
  DEFAULT_WEEKLY_TARGET,
  type FocusSession,
  type PlannerTask,
} from "@/lib/planner";
import {
  computeWeakTopics,
  subscribeAttempts,
  type QuizAttempt,
} from "@/lib/quizzes";

/* ------------------------------------------------------------------ */
/* Static config                                                       */
/* ------------------------------------------------------------------ */

const DAILY_FOCUS_GOAL = 60; // minutes; drives the focus ring and chart goal line
const HEAT_WEEKS = 16;

// Shared card look: normal card in light mode, soft glass gradient in dark mode.
const CARD = "card dark:bg-gradient-to-b dark:from-white/[0.05] dark:to-transparent";
const HOVER_GLOW =
  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft dark:hover:border-lavender-dark/40 dark:hover:shadow-[0_12px_32px_-14px_rgba(139,123,224,0.55)]";

const QUICK_ACTIONS = [
  { icon: IconUpload, label: "Upload PDF", hint: "Add material", href: "/dashboard/materials", accent: "bg-lavender/10 text-lavender-dark" },
  { icon: IconNotes, label: "Generate notes", hint: "Open notes", href: "/dashboard/notes", accent: "bg-sky/10 text-sky" },
  { icon: IconHelpCircle, label: "Generate quiz", hint: "Test yourself", href: "/dashboard/quizzes", accent: "bg-coral/10 text-coral" },
  { icon: IconCalendarEvent, label: "Open planner", hint: "Plan your week", href: "/dashboard/planner", accent: "bg-pastel-orange/10 text-pastel-orange" },
  { icon: IconClock, label: "View timetable", hint: "Your classes", href: "/dashboard/timetable", accent: "bg-mint/10 text-mint" },
];

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

const MEDALS: Record<number, string> = {
  1: "from-[#f7d154] to-[#f59e0b] text-white",
  2: "from-[#d5dbe5] to-[#94a3b8] text-white",
  3: "from-[#e8b48c] to-[#c2763f] text-white",
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-coral",
  medium: "bg-pastel-orange",
  low: "bg-mint",
};
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

const HEAT_OPACITY = [0, 0.3, 0.5, 0.75, 1];
const DONUT_COLORS = ["#8b7be0", "#5cc8f0", "#f58a7c", "#f5b66c", "#6fd8b0"];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type ClassEntry = {
  id: string;
  day: string;
  time: string;
  endTime?: string;
  subjectId: string;
  room?: string;
};

type Badge = {
  id: string;
  icon: typeof IconFlame;
  label: string;
  hint: string;
  unlocked: boolean;
};

type LevelInfo = {
  xp: number;
  level: number;
  into: number;
  span: number;
  badges: Badge[];
};

type DonutItem = { label: string; min: number; color: string };

type FeedEvent = {
  id: string;
  icon: typeof IconCheck;
  tone: string;
  title: string;
  sub: string;
  time: Date;
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x;
}

function toMin(t?: string) {
  if (!t) return NaN;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function fmtClock(t?: string) {
  const mins = toMin(t);
  if (Number.isNaN(mins)) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${ap}`;
}

function fmtMinutes(m: number) {
  const v = Math.round(m);
  if (v < 60) return `${v}m`;
  const h = Math.floor(v / 60);
  const r = v % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

const fmtInt = (n: number) => String(Math.round(n));

function subjectName(id: string) {
  const list = SUBJECTS as unknown as Array<Record<string, unknown>>;
  const s = Array.isArray(list) ? list.find((x) => x.id === id) : undefined;
  return String(s?.name ?? s?.title ?? id);
}

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function dueLabel(due: string, today: string, tomorrow: string) {
  if (!due) return "No due date";
  const d = new Date(due + "T00:00:00");
  const short = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  if (due < today) return `Overdue · ${short}`;
  if (due === today) return "Due today";
  if (due === tomorrow) return "Due tomorrow";
  return `Due ${short}`;
}

function relTime(d: Date, now: Date) {
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function computeStreak(activeDays: Set<string>, now: Date) {
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!activeDays.has(ymd(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (activeDays.has(ymd(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Smooth curve through points (coordinates in a 0-100 box). */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

/** Fade/slide-in wrapper (CSS only). */
function Reveal({
  show,
  delay = 0,
  className = "",
  children,
}: {
  show: boolean;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`transition-all duration-500 ease-out motion-reduce:transition-none ${
        show ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${className}`}
      style={{ transitionDelay: show ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title,
  linkLabel,
  href,
  right,
}: {
  title: string;
  linkLabel?: string;
  href?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h4 className="text-[14.5px]">{title}</h4>
      {right}
      {linkLabel && href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-xs font-semibold text-lavender-dark"
        >
          {linkLabel}
          <IconArrowRight
            size={13}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-alt dark:bg-surface-alt-dark ${className}`}
    />
  );
}

/** Animates a number from its previous value (cheap rAF, respects reduced motion). */
function CountUp({
  value,
  format = fmtInt,
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const [shown, setShown] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    if (prev.current === value) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      prev.current = value;
      setShown(value);
      return;
    }
    const from = prev.current;
    const start = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{format(shown)}</>;
}

const StatTile = memo(function StatTile({
  icon: Icon,
  bg,
  color,
  num,
  format = fmtInt,
  suffix = "",
  label,
  sub,
  progress,
  dots,
  todayIndex,
}: {
  icon: typeof IconFlame;
  bg: string;
  color: string;
  num: number | null;
  format?: (n: number) => string;
  suffix?: string;
  label: string;
  sub?: string;
  progress?: number;
  dots?: boolean[];
  todayIndex?: number;
}) {
  return (
    // Shared min-height + flex column so every tile lines up, with the sub-label pinned to the bottom.
    <div className={`${CARD} flex min-h-[148px] flex-col p-4 ${HOVER_GLOW}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}>
          <Icon size={18} stroke={1.8} />
        </div>
        <div className="min-w-0">
          {num === null ? (
            <div className="h-6 w-14 animate-pulse rounded bg-surface-alt dark:bg-surface-alt-dark" />
          ) : (
            <p className="truncate text-xl font-bold leading-tight">
              <CountUp value={num} format={format} />
              {suffix}
            </p>
          )}
          <p className="truncate text-[11.5px] text-ink-secondary dark:text-ink-secondary-dark">
            {label}
          </p>
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-alt dark:bg-surface-alt-dark">
          <div
            className="h-full rounded-full bg-brand-gradient transition-[width] duration-700 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {dots && (
        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            {dots.map((on, i) => (
              <span
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  on
                    ? "bg-pastel-orange"
                    : "bg-surface-alt dark:bg-white/10"
                } ${i === todayIndex ? "ring-1 ring-pastel-orange/60 ring-offset-1 ring-offset-transparent" : ""}`}
              />
            ))}
          </div>
          <div className="mt-1 flex gap-1.5">
            {WEEK_LETTERS.map((l, i) => (
              <span
                key={i}
                className={`flex-1 text-center text-[9px] ${
                  i === todayIndex
                    ? "font-bold text-pastel-orange"
                    : "text-ink-muted dark:text-ink-muted-dark"
                }`}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {sub && (
        <p className="mt-auto truncate pt-2 text-[11px] text-ink-muted dark:text-ink-muted-dark">
          {sub}
        </p>
      )}
    </div>
  );
});

const QuickActions = memo(function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {QUICK_ACTIONS.map((action) => (
        // Horizontal layout (icon beside text) saves ~40px of height so charts sit higher.
        <Link
          key={action.label}
          href={action.href}
          prefetch
          className={`${CARD} group relative flex min-w-[170px] flex-1 items-center gap-3 p-3.5 text-left ${HOVER_GLOW}`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${action.accent}`}
          >
            <action.icon size={19} stroke={1.75} />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-[12.5px] font-semibold">{action.label}</span>
            <span className="block truncate text-[11px] text-ink-muted dark:text-ink-muted-dark">
              {action.hint}
            </span>
          </div>
          <IconArrowRight
            size={15}
            className="ml-auto shrink-0 -translate-x-1 text-ink-muted opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:text-ink-muted-dark"
          />
        </Link>
      ))}
    </div>
  );
});

const Leaderboard = memo(function Leaderboard() {
  return (
    <div className={`${CARD} p-5`}>
      <CardHeader title="Leaderboard" linkLabel="See all" href="/dashboard/leaderboard" />
      {LEADERBOARD.map((entry) => {
        const medal = MEDALS[entry.rank];
        return (
          <div
            key={entry.rank}
            className={`-mx-2 flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm transition-colors ${
              entry.isCurrentUser
                ? "bg-lavender/10"
                : "hover:bg-surface-alt/60 dark:hover:bg-white/5"
            }`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                medal ? `bg-gradient-to-br ${medal}` : "bg-surface-alt dark:bg-surface-alt-dark"
              }`}
            >
              {entry.rank === 1 ? <IconCrown size={13} /> : entry.rank}
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mint to-sky text-[10px] font-bold text-white">
              {initialsOf(entry.name)}
            </div>
            <p className={`flex-1 truncate ${entry.isCurrentUser ? "font-semibold" : ""}`}>
              {entry.name}
              {entry.isCurrentUser && (
                <span className="ml-1.5 text-[10.5px] font-bold text-lavender-dark">you</span>
              )}
            </p>
            <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
              {entry.points}
            </p>
          </div>
        );
      })}
    </div>
  );
});

/** Three concentric activity rings (focus / tasks / classes). */
function ActivityRings({
  focus,
  tasks,
  classes,
  overall,
  ready,
  loading,
}: {
  focus: number;
  tasks: number;
  classes: number;
  overall: number;
  ready: boolean;
  loading: boolean;
}) {
  // Thinner strokes + wider spacing leave a roomier centre for the percentage.
  const rings = [
    { r: 70, v: focus, color: "#ffffff", delay: 0 },
    { r: 57, v: tasks, color: "#ffe29a", delay: 120 },
    { r: 44, v: classes, color: "#b9f6df", delay: 240 },
  ];
  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden>
        {rings.map((ring) => {
          const c = 2 * Math.PI * ring.r;
          const v = clamp01(ring.v);
          return (
            <g key={ring.r}>
              <circle
                cx="80"
                cy="80"
                r={ring.r}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="80"
                cy="80"
                r={ring.r}
                fill="none"
                stroke={ring.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={ready && !loading ? c * (1 - v) : c}
                strokeOpacity={v > 0 ? 1 : 0}
                transform="rotate(-90 80 80)"
                style={{
                  transition: `stroke-dashoffset 1000ms cubic-bezier(.22,1,.36,1) ${ring.delay}ms`,
                }}
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {loading ? (
          <div className="h-6 w-10 animate-pulse rounded bg-white/25" />
        ) : (
          <>
            <span className="text-xl font-bold leading-none">
              <CountUp value={Math.round(overall * 100)} />%
            </span>
            <span className="mt-1 text-[9.5px] font-semibold uppercase tracking-wider text-white/90">
              of today
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/** Smooth area chart of focus minutes this week with a daily-goal line. */
const StudyChart = memo(function StudyChart({
  perDay,
  todayIndex,
  ready,
}: {
  perDay: number[];
  todayIndex: number;
  ready: boolean;
}) {
  const weekMin = perDay.reduce((a, b) => a + b, 0);
  const yMax = Math.max(...perDay, DAILY_FOCUS_GOAL) * 1.2;

  const pts = perDay.map((m, i) => ({
    x: ((i + 0.5) / 7) * 100,
    y: 100 - (m / yMax) * 100,
  }));
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x} 100 L ${pts[0].x} 100 Z`;
  const goalY = 100 - (DAILY_FOCUS_GOAL / yMax) * 100;

  return (
    <div>
      <div className="relative h-48">
        <div
          aria-hidden
          className="absolute inset-x-0 border-t border-dashed border-line dark:border-line-dark"
          style={{ top: `${goalY}%` }}
        >
          <span className="absolute -top-2 right-0 bg-surface-card px-1 text-[10px] text-ink-muted dark:bg-surface-card-dark dark:text-ink-muted-dark">
            Goal {fmtMinutes(DAILY_FOCUS_GOAL)}
          </span>
        </div>

        <div
          className="absolute inset-0 transition-[clip-path] duration-[1100ms] ease-out motion-reduce:transition-none"
          style={{ clipPath: ready ? "inset(0 0 0 0)" : "inset(0 100% 0 0)" }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full"
            style={{ overflow: "hidden" }}
            aria-hidden
          >
            <defs>
              <linearGradient id="studyArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b7be0" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#8b7be0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#studyArea)" />
            <path
              d={line}
              fill="none"
              stroke="#8b7be0"
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="absolute inset-0 flex">
          {perDay.map((m, i) => {
            const isToday = i === todayIndex;
            return (
              <div key={i} className="group relative flex-1">
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line opacity-0 transition-opacity group-hover:opacity-100 dark:bg-line-dark" />
                <div
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ top: `${pts[i].y}%` }}
                >
                  {isToday && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-lavender-dark/40" />
                  )}
                  <span
                    className={`relative block rounded-full border-2 border-lavender-dark bg-white transition-transform duration-200 group-hover:scale-125 dark:bg-surface-card-dark ${
                      isToday ? "h-3.5 w-3.5" : "h-2.5 w-2.5"
                    }`}
                  />
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-primary px-2 py-1 text-[10.5px] font-semibold text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100 dark:bg-white dark:text-[#1b1630]">
                    {m > 0 ? fmtMinutes(m) : "No focus"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {weekMin === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-card/90 px-5 py-3 text-center shadow-soft dark:bg-surface-card-dark/90">
              <p className="text-[12.5px] text-ink-secondary dark:text-ink-secondary-dark">
                No focus time yet this week
              </p>
              <Link
                href="/dashboard/planner"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-[11.5px] font-semibold text-white"
              >
                <IconPlayerPlay size={13} />
                Start a session
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex">
        {WEEK_LETTERS.map((l, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[11px] ${
              i === todayIndex
                ? "font-bold text-lavender-dark"
                : "text-ink-muted dark:text-ink-muted-dark"
            }`}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
});

/** Level, XP bar and badge grid. */
const LevelCard = memo(function LevelCard({ info }: { info: LevelInfo | null }) {
  if (!info) {
    return (
      <div className={`${CARD} p-5`}>
        <CardHeader title="Your level" />
        <Skeleton className="mb-4 h-14" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-16" />
          ))}
        </div>
      </div>
    );
  }
  const pct = clamp01(info.into / info.span) * 100;
  const unlocked = info.badges.filter((b) => b.unlocked).length;

  return (
    <div className={`${CARD} p-5`}>
      <CardHeader
        title="Your level"
        right={
          <span className="ml-auto text-xs text-ink-secondary dark:text-ink-secondary-dark">
            {info.xp} XP total
          </span>
        }
      />

      <div className="flex items-center gap-3.5">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-soft">
          <span className="text-xl font-extrabold leading-none">{info.level}</span>
          <span className="absolute -bottom-1.5 rounded-full bg-white px-1.5 text-[8.5px] font-bold uppercase tracking-wide text-lavender-dark shadow-soft dark:bg-[#1b1630]">
            Level
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
            <span className="font-semibold">
              {info.into} / {info.span} XP
            </span>
            <span className="text-ink-muted dark:text-ink-muted-dark">
              {info.span - info.into} to level {info.level + 1}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-alt dark:bg-white/10">
            <div
              className="h-full rounded-full bg-brand-gradient transition-[width] duration-1000 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10.5px] text-ink-muted dark:text-ink-muted-dark">
            1 XP per focus minute, 10 per task, 15 per quiz
          </p>
        </div>
      </div>

      <div className="mb-2 mt-5 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted dark:text-ink-muted-dark">
          Badges
        </p>
        <p className="text-[11px] text-ink-secondary dark:text-ink-secondary-dark">
          {unlocked}/{info.badges.length} unlocked
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {info.badges.map((b) => (
          <div
            key={b.id}
            title={b.hint}
            className={`relative flex flex-col items-center gap-1.5 rounded-xl px-1.5 py-2.5 text-center transition-all duration-200 ${
              b.unlocked
                ? "bg-lavender/10 dark:bg-lavender/15"
                : "bg-surface-alt opacity-60 dark:bg-white/5"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                b.unlocked
                  ? "bg-brand-gradient text-white shadow-soft"
                  : "bg-white/70 text-ink-muted dark:bg-white/10 dark:text-ink-muted-dark"
              }`}
            >
              {b.unlocked ? <b.icon size={16} /> : <IconLock size={14} />}
            </span>
            <span className="text-[10.5px] font-semibold leading-tight">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

/** Donut of this week's focus time by subject. */
const SubjectDonut = memo(function SubjectDonut({
  items,
  total,
  ready,
  loading,
}: {
  items: DonutItem[];
  total: number;
  ready: boolean;
  loading: boolean;
}) {
  const r = 40;
  const c = 2 * Math.PI * r;
  let cum = 0;

  return (
    <div className={`${CARD} p-5`}>
      <CardHeader
        title="Focus by subject"
        right={
          <span className="ml-auto text-xs text-ink-secondary dark:text-ink-secondary-dark">
            This week
          </span>
        }
      />

      {loading ? (
        <Skeleton className="h-28" />
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-28 w-28 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="none"
                strokeWidth="12"
                className="stroke-surface-alt dark:stroke-white/10"
              />
              {total > 0 &&
                items.map((it, i) => {
                  const len = (it.min / total) * c;
                  const offset = -cum;
                  cum += len;
                  return (
                    <circle
                      key={it.label + i}
                      cx="50"
                      cy="50"
                      r={r}
                      fill="none"
                      stroke={it.color}
                      strokeWidth="12"
                      strokeDasharray={`${ready ? Math.max(0, len - 1.5) : 0} ${c}`}
                      strokeDashoffset={offset}
                      transform="rotate(-90 50 50)"
                      style={{ transition: `stroke-dasharray 900ms ease-out ${i * 120}ms` }}
                    />
                  );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-bold leading-none">{fmtMinutes(total)}</span>
              <span className="mt-0.5 text-[9.5px] uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark">
                focused
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            {total === 0 ? (
              <p className="text-[12px] text-ink-secondary dark:text-ink-secondary-dark">
                Link a focus session to a subject in the Planner and it shows up here.
              </p>
            ) : (
              items.map((it) => (
                <div key={it.label} className="flex items-center gap-2 text-[12px]">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: it.color }}
                  />
                  <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  <span className="text-ink-secondary dark:text-ink-secondary-dark">
                    {fmtMinutes(it.min)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

/** Timeline of recent focus sessions, completed tasks and quiz attempts. */
const ActivityFeed = memo(function ActivityFeed({
  events,
  now,
}: {
  events: FeedEvent[] | null;
  now: Date | null;
}) {
  return (
    <div className={`${CARD} p-5`}>
      <CardHeader title="Recent activity" />

      {!events || !now ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-10" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="py-3 text-sm text-ink-secondary dark:text-ink-secondary-dark">
          Nothing yet. Finish a task, a focus session or a quiz and it will appear here.
        </p>
      ) : (
        <ol className="relative space-y-3.5 pl-1">
          <span
            aria-hidden
            className="absolute bottom-2 left-[19px] top-2 w-px bg-line dark:bg-line-dark"
          />
          {events.map((ev) => (
            <li key={ev.id} className="relative flex items-center gap-3">
              <span
                className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-surface-card dark:ring-[#1c1730] ${ev.tone}`}
              >
                <ev.icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{ev.title}</p>
                <p className="truncate text-[11.5px] text-ink-muted dark:text-ink-muted-dark">
                  {ev.sub}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-ink-muted dark:text-ink-muted-dark">
                {relTime(ev.time, now)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { profile } = useAuth();
  const name = profile?.name ?? "Student";

  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  // Live data (null = first snapshot not received yet)
  const [classes, setClasses] = useState<ClassEntry[] | null>(null);
  const [tasks, setTasks] = useState<PlannerTask[] | null>(null);
  const [sessions, setSessions] = useState<FocusSession[] | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[] | null>(null);
  const [target, setTarget] = useState(DEFAULT_WEEKLY_TARGET);

  // Local UI state
  const [completing, setCompleting] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [addedTopics, setAddedTopics] = useState<Record<string, boolean>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Clock: client only (no hydration mismatch), once a minute, paused while the tab is hidden.
  useEffect(() => {
    setNow(new Date());
    let t: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!t) t = setInterval(() => setNow(new Date()), 60_000);
    };
    const stop = () => {
      if (t) clearInterval(t);
      t = null;
    };
    const onVis = () => {
      if (document.hidden) stop();
      else {
        setNow(new Date());
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (u) => setUid(u?.uid ?? null));
  }, []);

  // One listener per collection, all cleaned up together.
  useEffect(() => {
    if (!uid) return;
    const unsubs = [
      subscribeTasks(uid, setTasks, (e) => {
        console.error("dashboard tasks", e);
        setTasks([]);
      }),
      subscribeFocusSessions(uid, setSessions, (e) => {
        console.error("dashboard sessions", e);
        setSessions([]);
      }),
      subscribeAttempts(uid, setAttempts, (e) => {
        console.error("dashboard attempts", e);
        setAttempts([]);
      }),
      subscribeWeeklyTarget(uid, setTarget, (e) =>
        console.error("dashboard weekly target", e)
      ),
      onSnapshot(
        collection(db, "users", uid, "timetable"),
        (snap) =>
          setClasses(
            snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<ClassEntry, "id">),
            }))
          ),
        (e) => {
          console.error("dashboard timetable", e);
          setClasses([]);
        }
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  /* ---------------- Derived data ---------------- */

  const todayStr = now ? ymd(now) : "";
  const tomorrowStr = useMemo(() => (now ? ymd(addDays(now, 1)) : ""), [now]);
  const todayIndex = now ? (now.getDay() + 6) % 7 : -1;

  const today = useMemo(() => {
    if (!now || !classes) return null;
    const key = DAY_KEYS[now.getDay()];
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    const list = classes
      .filter((c) => String(c.day).toLowerCase().startsWith(key))
      .map((c) => {
        const start = toMin(c.time);
        const endRaw = toMin(c.endTime);
        const end = Number.isNaN(endRaw) ? start + 60 : endRaw;
        return { ...c, start, end };
      })
      .filter((c) => !Number.isNaN(c.start))
      .sort((a, b) => a.start - b.start);

    const current = list.find((c) => c.start <= minutesNow && minutesNow < c.end);
    const next = list.find((c) => c.start > minutesNow);
    const remaining = list.filter((c) => c.end > minutesNow).length;
    const finished = list.filter((c) => c.end <= minutesNow).length;
    return { list, current, next, remaining, finished, minutesNow };
  }, [classes, now]);

  const taskInfo = useMemo(() => {
    if (!tasks || !now) return null;
    const open = tasks.filter((t) => !t.done);
    const overdue = open.filter((t) => t.due && t.due < todayStr);
    const dueToday = open.filter((t) => t.due === todayStr);
    const weekStart = startOfWeek(now);
    const doneThisWeek = tasks.filter(
      (t) => t.done && t.completedAt && t.completedAt >= weekStart
    ).length;

    const upcoming = [...open]
      .sort((a, b) => {
        const ad = a.due || "9999-99-99";
        const bd = b.due || "9999-99-99";
        if (ad !== bd) return ad < bd ? -1 : 1;
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      })
      .slice(0, 5);

    return { open, overdue, dueToday, doneThisWeek, upcoming };
  }, [tasks, now, todayStr]);

  // Per-day activity (focus minutes + completed tasks): feeds streak, dots, rings, heatmap.
  const activity = useMemo(() => {
    if (!sessions || !tasks) return null;
    const map = new Map<string, { min: number; tasks: number }>();
    const bump = (d: Date, min: number, t: number) => {
      const k = ymd(d);
      const e = map.get(k) ?? { min: 0, tasks: 0 };
      e.min += min;
      e.tasks += t;
      map.set(k, e);
    };
    sessions.forEach((s) => s.completedAt && bump(s.completedAt, s.minutes, 0));
    tasks.forEach((t) => t.done && t.completedAt && bump(t.completedAt, 0, 1));
    return map;
  }, [sessions, tasks]);

  const focusInfo = useMemo(() => {
    if (!sessions || !now) return null;
    const weekStart = startOfWeek(now);
    const perDay = [0, 0, 0, 0, 0, 0, 0];
    const bySubject = new Map<string, number>();
    for (const s of sessions) {
      if (!s.completedAt || s.completedAt < weekStart) continue;
      perDay[(s.completedAt.getDay() + 6) % 7] += s.minutes;
      const key = s.subjectId || "";
      bySubject.set(key, (bySubject.get(key) ?? 0) + s.minutes);
    }
    const todayMin = perDay[(now.getDay() + 6) % 7];
    const weekMin = perDay.reduce((a, b) => a + b, 0);
    return { perDay, todayMin, weekMin, bySubject };
  }, [sessions, now]);

  const donut = useMemo(() => {
    if (!focusInfo) return null;
    const sorted = [...focusInfo.bySubject.entries()]
      .filter(([, m]) => m > 0)
      .sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, DONUT_COLORS.length - 1);
    const restMin = sorted.slice(DONUT_COLORS.length - 1).reduce((a, [, m]) => a + m, 0);
    const items: DonutItem[] = top.map(([id, min], i) => ({
      label: id ? subjectName(id) : "General",
      min,
      color: DONUT_COLORS[i],
    }));
    if (restMin > 0) {
      items.push({ label: "Other", min: restMin, color: DONUT_COLORS[DONUT_COLORS.length - 1] });
    }
    return { items, total: focusInfo.weekMin };
  }, [focusInfo]);

  const streak = useMemo(
    () => (activity && now ? computeStreak(new Set(activity.keys()), now) : null),
    [activity, now]
  );

  const weekDots = useMemo(() => {
    if (!activity || !now) return undefined;
    const ws = startOfWeek(now);
    return Array.from({ length: 7 }, (_, i) => activity.has(ymd(addDays(ws, i))));
  }, [activity, now]);

  const quizInfo = useMemo(() => {
    if (!attempts) return null;
    const recent = attempts.slice(0, 10);
    const correct = recent.reduce((a, r) => a + r.correctCount, 0);
    const total = recent.reduce((a, r) => a + r.totalCount, 0);
    return {
      avg: total > 0 ? Math.round((correct / total) * 100) : null,
      count: attempts.length,
      weak: computeWeakTopics(attempts).slice(0, 4),
    };
  }, [attempts]);

  // Today's rings
  const day = useMemo(() => {
    if (!now || !focusInfo || !taskInfo || !today || !activity) return null;
    const doneToday = activity.get(todayStr)?.tasks ?? 0;
    const dueNow = taskInfo.open.filter((t) => t.due && t.due <= todayStr).length;
    const taskTotal = doneToday + dueNow;
    const classTotal = today.list.length;

    const focus = clamp01(focusInfo.todayMin / DAILY_FOCUS_GOAL);
    const tasksP = taskTotal > 0 ? doneToday / taskTotal : 0;
    const classesP = classTotal > 0 ? today.finished / classTotal : 0;

    const parts = [focus];
    if (taskTotal > 0) parts.push(tasksP);
    if (classTotal > 0) parts.push(classesP);
    const overall = parts.reduce((a, b) => a + b, 0) / parts.length;

    return {
      focus,
      tasksP,
      classesP,
      overall,
      doneToday,
      taskTotal,
      classTotal,
      classDone: today.finished,
      focusMin: focusInfo.todayMin,
    };
  }, [now, focusInfo, taskInfo, today, activity, todayStr]);

  const heroLine = useMemo(() => {
    if (!day || !today) return "Loading your day…";
    const parts: string[] = [];
    if (today.remaining > 0)
      parts.push(`${today.remaining} class${today.remaining === 1 ? "" : "es"} left`);
    const tasksLeft = day.taskTotal - day.doneToday;
    if (tasksLeft > 0) parts.push(`${tasksLeft} task${tasksLeft === 1 ? "" : "s"} to finish`);
    parts.push(
      day.focusMin >= DAILY_FOCUS_GOAL
        ? "focus goal reached"
        : `${DAILY_FOCUS_GOAL - day.focusMin} min of focus to hit your goal`
    );
    return parts.join(" · ");
  }, [day, today]);

  const heroTitle = !day
    ? "Your day at a glance"
    : day.overall >= 1
    ? "Day complete. Well done."
    : day.overall >= 0.5
    ? "Over halfway there"
    : "Your day at a glance";

  // Consistency heatmap
  const heat = useMemo(() => {
    if (!activity || !now) return null;
    const start = addDays(startOfWeek(now), -(HEAT_WEEKS - 1) * 7);
    const columns: {
      key: string;
      level: number;
      future: boolean;
      isToday: boolean;
      title: string;
    }[][] = [];
    let activeDays = 0;
    let totalMin = 0;
    let longest = 0;
    let run = 0;

    for (let w = 0; w < HEAT_WEEKS; w++) {
      const col: (typeof columns)[number] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const key = ymd(date);
        const future = key > todayStr;
        const a = activity.get(key);
        const score = a ? a.min / 20 + a.tasks : 0;
        const level = score <= 0 ? 0 : score >= 7 ? 4 : score >= 4 ? 3 : score >= 2 ? 2 : 1;

        if (!future) {
          if (a) {
            activeDays += 1;
            totalMin += a.min;
            run += 1;
            longest = Math.max(longest, run);
          } else run = 0;
        }

        col.push({
          key,
          level,
          future,
          isToday: key === todayStr,
          title: future
            ? ""
            : `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${
                a ? `${fmtMinutes(a.min)} focus, ${a.tasks} task${a.tasks === 1 ? "" : "s"}` : "no activity"
              }`,
        });
      }
      columns.push(col);
    }
    return { columns, activeDays, totalMin, longest };
  }, [activity, now, todayStr]);

  // Level, XP and badges
  const levelInfo = useMemo<LevelInfo | null>(() => {
    if (!tasks || !sessions || !attempts) return null;
    const totalMin = sessions.reduce((a, s) => a + s.minutes, 0);
    const doneTasks = tasks.filter((t) => t.done).length;
    const xp = Math.round(totalMin + doneTasks * 10 + attempts.length * 15);

    let level = 1;
    while (xp >= 50 * (level + 1) * level) level += 1;
    const base = 50 * level * (level - 1);
    const next = 50 * (level + 1) * level;

    const bestStreak = Math.max(streak ?? 0, heat?.longest ?? 0);
    const avg = quizInfo?.avg ?? 0;
    const weeklyDone = taskInfo?.doneThisWeek ?? 0;

    const badges: Badge[] = [
      { id: "first", icon: IconRocket, label: "First focus", hint: "Finish a focus session", unlocked: sessions.length >= 1 },
      { id: "streak3", icon: IconFlame, label: "3-day streak", hint: "Be active 3 days in a row", unlocked: bestStreak >= 3 },
      { id: "tasks10", icon: IconTargetArrow, label: "Task crusher", hint: "Complete 10 tasks", unlocked: doneTasks >= 10 },
      { id: "quiz", icon: IconMedal, label: "Quiz ace", hint: "Average 80%+ over 3 or more quizzes", unlocked: attempts.length >= 3 && avg >= 80 },
      { id: "marathon", icon: IconBolt, label: "Marathon", hint: "Focus for 5 hours in total", unlocked: totalMin >= 300 },
      { id: "week", icon: IconTrophy, label: "Week warrior", hint: "Hit your weekly task goal", unlocked: weeklyDone >= target && target > 0 },
    ];

    return { xp, level, into: xp - base, span: next - base, badges };
  }, [tasks, sessions, attempts, streak, heat, quizInfo, taskInfo, target]);

  // Recent activity feed
  const feed = useMemo<FeedEvent[] | null>(() => {
    if (!tasks || !sessions || !attempts) return null;
    const events: FeedEvent[] = [];
    sessions.slice(0, 8).forEach((s) => {
      if (!s.completedAt) return;
      events.push({
        id: `s-${s.id}`,
        icon: IconClockHour4,
        tone: "bg-sky/15 text-sky",
        title: `Focused for ${fmtMinutes(s.minutes)}`,
        sub: s.subjectId ? subjectName(s.subjectId) : "General focus",
        time: s.completedAt,
      });
    });
    tasks
      .filter((t) => t.done && t.completedAt)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
      .slice(0, 8)
      .forEach((t) => {
        events.push({
          id: `t-${t.id}`,
          icon: IconCheck,
          tone: "bg-mint/15 text-mint",
          title: "Completed a task",
          sub: t.title,
          time: t.completedAt!,
        });
      });
    attempts.slice(0, 8).forEach((a) => {
      if (!a.completedAt) return;
      const pct = a.totalCount > 0 ? Math.round((a.correctCount / a.totalCount) * 100) : 0;
      events.push({
        id: `a-${a.id}`,
        icon: IconHelpCircle,
        tone: "bg-lavender/15 text-lavender-dark",
        title: `Scored ${pct}% on a quiz`,
        sub: a.quizTitle,
        time: a.completedAt,
      });
    });
    return events.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 6);
  }, [tasks, sessions, attempts]);

  const notifications = useMemo(() => {
    const list: {
      id: string;
      icon: typeof IconBellRinging;
      tone: string;
      title: string;
      body: string;
      href: string;
    }[] = [];

    if (taskInfo && taskInfo.overdue.length > 0) {
      const n = taskInfo.overdue.length;
      list.push({
        id: `overdue-${n}`,
        icon: IconBellRinging,
        tone: "bg-coral/10 text-coral",
        title: `${n} overdue task${n === 1 ? "" : "s"}`,
        body: taskInfo.overdue[0].title,
        href: "/dashboard/planner",
      });
    }
    if (taskInfo && taskInfo.dueToday.length > 0) {
      const n = taskInfo.dueToday.length;
      list.push({
        id: `today-${n}`,
        icon: IconClipboardList,
        tone: "bg-pastel-orange/10 text-pastel-orange",
        title: `${n} task${n === 1 ? "" : "s"} due today`,
        body: taskInfo.dueToday[0].title,
        href: "/dashboard/planner",
      });
    }
    if (today?.next && today.next.start - today.minutesNow <= 30) {
      const mins = today.next.start - today.minutesNow;
      list.push({
        id: `class-${today.next.id}`,
        icon: IconClock,
        tone: "bg-sky/20 text-ink-secondary dark:text-ink-secondary-dark",
        title: `Class starts in ${mins} min`,
        body: subjectName(today.next.subjectId),
        href: "/dashboard/timetable",
      });
    }
    if (quizInfo && quizInfo.weak.length > 0) {
      const n = quizInfo.weak.length;
      list.push({
        id: `weak-${quizInfo.weak.join("|")}`,
        icon: IconSparkles,
        tone: "bg-lavender/10 text-lavender-dark",
        title: `${n} topic${n === 1 ? "" : "s"} need revision`,
        body: quizInfo.weak[0],
        href: "/dashboard/quizzes",
      });
    }
    return list;
  }, [taskInfo, today, quizInfo]);

  const visibleNotifications = notifications.filter((n) => !dismissed[n.id]);

  /* ---------------- Actions ---------------- */

  function completeTask(id: string) {
    if (!uid || completing[id]) return;
    setCompleting((c) => ({ ...c, [id]: true }));
    const t = setTimeout(async () => {
      try {
        await setTaskDone(uid, id, true);
      } catch (e) {
        console.error("complete task", e);
      } finally {
        setCompleting((c) => {
          const next = { ...c };
          delete next[id];
          return next;
        });
      }
    }, 450);
    timers.current.push(t);
  }

  async function addReviewTask(topic: string) {
    if (!uid || addedTopics[topic]) return;
    setAddedTopics((a) => ({ ...a, [topic]: true }));
    try {
      await addTask(uid, {
        title: `Review: ${topic}`,
        subjectId: "",
        due: "",
        priority: "medium",
      });
    } catch (e) {
      console.error("add review task", e);
      setAddedTopics((a) => {
        const next = { ...a };
        delete next[topic];
        return next;
      });
    }
  }

  /* ---------------- View values ---------------- */

  const focusClass = today?.current ?? today?.next ?? null;
  const focusLabel = today?.current
    ? "Happening now"
    : today?.next
    ? "Up next"
    : today && today.list.length > 0
    ? "All done for today"
    : "No classes today";

  const pendingCount = taskInfo?.open.length ?? null;
  const weeklyDone = taskInfo?.doneThisWeek ?? 0;
  const weeklyLeft = Math.max(0, target - weeklyDone);

  const hour = now?.getHours() ?? 12;
  const DayIcon = hour >= 6 && hour < 17 ? IconSunHigh : hour >= 17 && hour < 20 ? IconSunset2 : IconMoon;
  const partOfDay =
    hour < 5 ? "Night" : hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : hour < 21 ? "Evening" : "Night";

  const ringsLoading = !day;

  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = now
    ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";

  return (
    <>
      {/* ---------------- Greeting ---------------- */}
      {/* mb-9 = the 24px gap used below the card + the 12px the "Life Score" badge sticks up above it */}
      <Reveal show={ready} className="mb-9">
        <header>
          <h1 className="text-2xl font-bold leading-tight sm:text-[26px]">
            {greeting}, {name}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary dark:text-ink-secondary-dark">
            {dateLabel && `${dateLabel} · `}
            &ldquo;Small steps, every night, compound into mastery.&rdquo;
          </p>
        </header>
      </Reveal>

      {/* ---------------- Life Score spotlight ---------------- */}
      <Reveal show={ready} delay={40} className="mb-6">
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-[32px] bg-brand-gradient opacity-20 blur-2xl"
          />
          <span className="absolute -top-3 left-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white shadow-soft">
            <IconSparkles size={12} />
            Life Score
          </span>
          <div className="relative rounded-3xl bg-brand-gradient p-[2px] shadow-[0_20px_50px_-20px_rgba(139,123,224,0.65)]">
            <div className="rounded-[22px] bg-surface-card p-2 dark:bg-surface-card-dark">
              <LifeScoreCard />
            </div>
          </div>
        </section>
      </Reveal>

      {/* ---------------- Hero: today's rings ---------------- */}
      <Reveal show={ready} className="mb-5">
        <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 text-white shadow-soft dark:bg-none dark:from-[#4a3fb0] dark:via-[#6d56d1] dark:to-[#9b78e8] dark:shadow-[0_24px_60px_-24px_rgba(124,107,214,0.65)] sm:p-7">
          {/* Soft highlight + decorative circles (plain gradients, cheap to paint) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.22),transparent_55%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-white/10"
          />

          <div className="relative grid items-center gap-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,320px)]">
            <div className="mx-auto lg:mx-0">
              <ActivityRings
                focus={day?.focus ?? 0}
                tasks={day?.tasksP ?? 0}
                classes={day?.classesP ?? 0}
                overall={day?.overall ?? 0}
                ready={ready}
                loading={ringsLoading}
              />
            </div>

            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-wide">
                <DayIcon size={13} />
                {now
                  ? `${partOfDay} · ${now
                      .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
                      .toUpperCase()}`
                  : "Today"}
              </span>

              <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-[28px]">
                {heroTitle}
              </h2>
              <p className="mt-1.5 text-sm text-white/90">{heroLine}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  {
                    dot: "#ffffff",
                    label: "Focus",
                    value: day ? `${fmtMinutes(day.focusMin)} / ${fmtMinutes(DAILY_FOCUS_GOAL)}` : "…",
                  },
                  {
                    dot: "#ffe29a",
                    label: "Tasks",
                    value: day ? (day.taskTotal > 0 ? `${day.doneToday} / ${day.taskTotal}` : "none due") : "…",
                  },
                  {
                    dot: "#b9f6df",
                    label: "Classes",
                    value: day ? (day.classTotal > 0 ? `${day.classDone} / ${day.classTotal}` : "none") : "…",
                  },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11.5px] font-medium"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: chip.dot }} />
                    {chip.label}
                    <span className="text-white/90">{chip.value}</span>
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  href="/dashboard/planner"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-lavender-dark shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <IconPlayerPlay size={16} />
                  Start focus session
                </Link>
                <Link
                  href="/dashboard/planner"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-white/30"
                >
                  <IconPlus size={16} />
                  Add a task
                </Link>
              </div>
            </div>

            {/* Right card stretches to the full hero height so it no longer floats in the empty space */}
            <div className="flex flex-col justify-center self-stretch rounded-2xl bg-white/15 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">
                {classes === null && uid ? "Checking timetable" : focusLabel}
              </p>

              {classes === null && uid ? (
                <div className="mt-3 space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-white/25" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-white/20" />
                </div>
              ) : focusClass ? (
                <div className="mt-2">
                  <p className="text-lg font-semibold leading-snug">
                    {subjectName(focusClass.subjectId)}
                  </p>
                  <p className="mt-1 text-sm text-white/90">
                    {fmtClock(focusClass.time)}
                    {focusClass.endTime ? ` – ${fmtClock(focusClass.endTime)}` : ""}
                    {focusClass.room ? ` · Room ${focusClass.room}` : ""}
                  </p>
                  {today?.current ? (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25">
                      <div
                        className="h-full rounded-full bg-white transition-[width] duration-700"
                        style={{
                          width: `${
                            clamp01(
                              (today.minutesNow - focusClass.start) /
                                (focusClass.end - focusClass.start)
                            ) * 100
                          }%`,
                        }}
                      />
                    </div>
                  ) : (
                    today?.next && (
                      <p className="mt-2 text-xs font-semibold text-white/90">
                        Starts in {fmtMinutes(today.next.start - today.minutesNow)}
                      </p>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-white/90">
                  {today && today.list.length > 0
                    ? "All classes done. Nice work."
                    : "Your timetable is clear. Use the time for revision."}
                </p>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ---------------- Stats ---------------- */}
      <Reveal show={ready} delay={60} className="mb-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile
            icon={IconFlame}
            bg="bg-pastel-orange/10"
            color="text-pastel-orange"
            num={streak}
            suffix={streak === 1 ? " day" : " days"}
            label="Study streak"
            dots={weekDots}
            todayIndex={todayIndex}
            sub={streak ? "Keep it going" : "Finish a task or session"}
          />
          <StatTile
            icon={IconClockHour4}
            bg="bg-sky/10"
            color="text-sky"
            num={focusInfo ? focusInfo.todayMin : null}
            format={fmtMinutes}
            label="Focus today"
            progress={focusInfo ? (focusInfo.todayMin / DAILY_FOCUS_GOAL) * 100 : 0}
            sub={focusInfo ? `${fmtMinutes(focusInfo.weekMin)} this week` : undefined}
          />
          <StatTile
            icon={IconTargetArrow}
            bg="bg-coral/10"
            color="text-coral"
            num={taskInfo ? weeklyDone : null}
            suffix={`/${target}`}
            label="Weekly goal"
            progress={taskInfo ? (weeklyDone / target) * 100 : 0}
            sub={taskInfo ? (weeklyLeft === 0 ? "Goal reached" : `${weeklyLeft} to go`) : undefined}
          />
          <StatTile
            icon={IconClipboardList}
            bg="bg-lavender/10"
            color="text-lavender-dark"
            num={pendingCount}
            label="Open tasks"
            sub={
              taskInfo
                ? taskInfo.overdue.length > 0
                  ? `${taskInfo.overdue.length} overdue`
                  : `${taskInfo.dueToday.length} due today`
                : undefined
            }
          />
          <StatTile
            icon={IconSchool}
            bg="bg-mint/10"
            color="text-mint"
            num={quizInfo === null ? null : quizInfo.avg ?? 0}
            suffix="%"
            label="Avg quiz score"
            progress={quizInfo?.avg ?? 0}
            sub={quizInfo ? `${quizInfo.count} attempt${quizInfo.count === 1 ? "" : "s"}` : undefined}
          />
        </div>
      </Reveal>

      {/* ---------------- Quick actions ---------------- */}
      <Reveal show={ready} delay={110} className="mb-5">
        <QuickActions />
      </Reveal>

      {/* ---------------- Main grid ---------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {/* Weekly study time */}
          <Reveal show={ready} delay={150}>
            <div className={`${CARD} min-h-[260px] p-5`}>
              <CardHeader
                title="Weekly study time"
                linkLabel="View analytics"
                href="/dashboard/analytics"
                right={
                  focusInfo ? (
                    <span className="ml-auto mr-3 text-xs text-ink-secondary dark:text-ink-secondary-dark">
                      {fmtMinutes(focusInfo.weekMin)} total
                    </span>
                  ) : null
                }
              />
              <StudyChart
                perDay={focusInfo?.perDay ?? [0, 0, 0, 0, 0, 0, 0]}
                todayIndex={todayIndex}
                ready={ready}
              />
            </div>
          </Reveal>

          {/* Consistency heatmap */}
          <Reveal show={ready} delay={190}>
            <div className={`${CARD} p-5`}>
              <CardHeader
                title="Consistency"
                right={
                  <span className="ml-auto text-xs text-ink-secondary dark:text-ink-secondary-dark">
                    Last {HEAT_WEEKS} weeks
                  </span>
                }
              />

              {heat ? (
                <>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {heat.columns.map((col, wi) => (
                        <div key={wi} className="flex flex-col gap-1">
                          {col.map((cell) => (
                            <div
                              key={cell.key}
                              title={cell.title}
                              className={`h-4 w-4 rounded-[4px] transition-transform duration-150 hover:scale-125 ${
                                cell.future
                                  ? "opacity-0"
                                  : cell.level === 0
                                  ? "bg-surface-alt dark:bg-white/[0.07]"
                                  : "bg-lavender-dark"
                              } ${cell.isToday ? "ring-1 ring-lavender-dark ring-offset-1 ring-offset-transparent" : ""}`}
                              style={
                                cell.level > 0 && !cell.future
                                  ? { opacity: HEAT_OPACITY[cell.level] }
                                  : undefined
                              }
                            />
                          ))}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-5 text-center">
                      <div>
                        <p className="text-lg font-bold leading-tight">{heat.activeDays}</p>
                        <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">active days</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold leading-tight">{heat.longest}</p>
                        <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">best streak</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold leading-tight">{fmtMinutes(heat.totalMin)}</p>
                        <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">focused</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1.5 text-[10.5px] text-ink-muted dark:text-ink-muted-dark">
                    Less
                    {HEAT_OPACITY.map((o, i) => (
                      <span
                        key={i}
                        className={`h-3 w-3 rounded-[3px] ${
                          i === 0 ? "bg-surface-alt dark:bg-white/[0.07]" : "bg-lavender-dark"
                        }`}
                        style={i > 0 ? { opacity: o } : undefined}
                      />
                    ))}
                    More
                  </div>
                </>
              ) : (
                <Skeleton className="h-32" />
              )}
            </div>
          </Reveal>

          {/* Today's classes */}
          <Reveal show={ready} delay={230}>
            <div className={`${CARD} p-5`}>
              <CardHeader
                title="Today's classes"
                linkLabel="Open timetable"
                href="/dashboard/timetable"
              />

              {classes === null && uid ? (
                <div className="space-y-2.5">
                  {[0, 1, 2].map((n) => (
                    <Skeleton key={n} className="h-12" />
                  ))}
                </div>
              ) : today && today.list.length > 0 ? (
                <div className="space-y-2">
                  {today.list.map((c) => {
                    const isNow = today.current?.id === c.id;
                    const isNext = !today.current && today.next?.id === c.id;
                    const isDone = c.end <= today.minutesNow;
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-200 ${
                          isNow
                            ? "border-lavender-dark/40 bg-lavender/10"
                            : "border-line bg-transparent dark:border-line-dark"
                        } ${isDone ? "opacity-55" : ""}`}
                      >
                        <div className="w-[88px] shrink-0 text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark">
                          {fmtClock(c.time)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{subjectName(c.subjectId)}</p>
                          <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">
                            {c.endTime ? `Until ${fmtClock(c.endTime)}` : "1 hour"}
                            {c.room ? ` · Room ${c.room}` : ""}
                          </p>
                        </div>
                        {isNow && (
                          <span className="rounded-full bg-lavender-dark px-2.5 py-0.5 text-[10.5px] font-bold text-white">
                            Now
                          </span>
                        )}
                        {isNext && (
                          <span className="rounded-full bg-sky/20 px-2.5 py-0.5 text-[10.5px] font-bold text-ink-secondary dark:text-ink-secondary-dark">
                            Next
                          </span>
                        )}
                        {isDone && (
                          <IconCheck size={16} className="text-ink-muted dark:text-ink-muted-dark" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-4 text-sm text-ink-secondary dark:text-ink-secondary-dark">
                  {uid
                    ? "No classes today. Add some in the Timetable to see them here."
                    : "Sign in to see today's classes."}
                </p>
              )}
            </div>
          </Reveal>

          {/* Upcoming tasks */}
          <Reveal show={ready} delay={270}>
            <div className={`${CARD} p-5`}>
              <CardHeader title="Upcoming tasks" linkLabel="Open planner" href="/dashboard/planner" />

              {tasks === null && uid ? (
                <div className="space-y-2.5">
                  {[0, 1, 2].map((n) => (
                    <Skeleton key={n} className="h-11" />
                  ))}
                </div>
              ) : taskInfo && taskInfo.upcoming.length > 0 ? (
                taskInfo.upcoming.map((task) => {
                  const done = !!completing[task.id];
                  const overdue = !!task.due && task.due < todayStr;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => completeTask(task.id)}
                      className="flex w-full items-center gap-3 border-b border-line py-2.5 text-left text-sm transition-colors last:border-none hover:bg-surface-alt/60 dark:border-line-dark dark:hover:bg-white/5"
                    >
                      <span
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                          done
                            ? "border-lavender-dark bg-lavender-dark text-white"
                            : "border-line dark:border-line-dark"
                        }`}
                      >
                        {done && <IconCheck size={12} stroke={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate transition-all duration-200 ${
                            done ? "text-ink-muted line-through dark:text-ink-muted-dark" : ""
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="block text-[11px] text-ink-muted dark:text-ink-muted-dark">
                          <span className={overdue ? "font-semibold text-coral" : ""}>
                            {dueLabel(task.due, todayStr, tomorrowStr)}
                          </span>
                          {task.subjectId ? ` · ${subjectName(task.subjectId)}` : ""}
                        </span>
                      </span>
                      <span
                        title={`${task.priority} priority`}
                        className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
                      />
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center text-ink-muted dark:text-ink-muted-dark">
                  <IconCheck size={22} />
                  <p className="text-[12.5px]">
                    {uid ? "No open tasks. Add one in the Planner." : "Sign in to see your tasks."}
                  </p>
                </div>
              )}
            </div>
          </Reveal>

          {/* Recent activity */}
          <Reveal show={ready} delay={310}>
            <ActivityFeed events={feed} now={now} />
          </Reveal>
        </div>

        <div className="space-y-4">
          {/* Level + badges */}
          <Reveal show={ready} delay={170}>
            <LevelCard info={levelInfo} />
          </Reveal>

          {/* Needs revision */}
          <Reveal show={ready} delay={210}>
            <div className={`${CARD} p-5`}>
              <CardHeader title="Needs revision" linkLabel="Quizzes" href="/dashboard/quizzes" />

              {attempts === null && uid ? (
                <div className="space-y-2">
                  {[0, 1].map((n) => (
                    <Skeleton key={n} className="h-9" />
                  ))}
                </div>
              ) : quizInfo && quizInfo.weak.length > 0 ? (
                <div className="space-y-2">
                  {quizInfo.weak.map((topic) => (
                    <div
                      key={topic}
                      className="flex items-center gap-2.5 rounded-xl bg-surface-alt px-3 py-2 dark:bg-white/5"
                    >
                      <IconBrain size={16} className="shrink-0 text-lavender-dark" />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{topic}</span>
                      <button
                        type="button"
                        disabled={!!addedTopics[topic]}
                        onClick={() => addReviewTask(topic)}
                        className="shrink-0 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-lavender-dark shadow-soft transition-opacity hover:opacity-80 disabled:opacity-60 dark:bg-white/10"
                      >
                        {addedTopics[topic] ? "Added" : "Add task"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-[12.5px] text-ink-secondary dark:text-ink-secondary-dark">
                  {quizInfo && quizInfo.count > 0
                    ? "No weak topics right now. Great work."
                    : "Take a quiz and the topics you struggle with will show up here."}
                </p>
              )}
            </div>
          </Reveal>

          {/* Focus by subject */}
          <Reveal show={ready} delay={250}>
            <SubjectDonut
              items={donut?.items ?? []}
              total={donut?.total ?? 0}
              ready={ready}
              loading={!donut}
            />
          </Reveal>

          <Reveal show={ready} delay={290}>
            <Leaderboard />
          </Reveal>

          {/* Notifications */}
          <Reveal show={ready} delay={330}>
            <div className={`${CARD} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-[14.5px]">
                  Notifications
                  {visibleNotifications.length > 0 && (
                    <span className="ml-2 rounded-full bg-lavender-dark px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {visibleNotifications.length}
                    </span>
                  )}
                </h4>

                {visibleNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDismissed((d) => {
                        const next = { ...d };
                        notifications.forEach((n) => (next[n.id] = true));
                        return next;
                      })
                    }
                    className="text-xs font-semibold text-lavender-dark"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {visibleNotifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center text-ink-muted dark:text-ink-muted-dark">
                  <IconBellOff size={22} />
                  <p className="text-[12.5px]">You are all caught up.</p>
                </div>
              ) : (
                visibleNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="group flex gap-2.5 border-b border-line py-2.5 text-[12.5px] last:border-none dark:border-line-dark"
                  >
                    <Link href={n.href} className="flex min-w-0 flex-1 gap-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${n.tone}`}>
                        <n.icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">{n.title}</p>
                        <p className="truncate text-ink-secondary dark:text-ink-secondary-dark">{n.body}</p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      aria-label="Dismiss notification"
                      onClick={() => setDismissed((d) => ({ ...d, [n.id]: true }))}
                      className="h-6 w-6 shrink-0 rounded-md text-ink-muted opacity-0 transition-opacity hover:bg-surface-alt focus-visible:opacity-100 group-hover:opacity-100 dark:text-ink-muted-dark dark:hover:bg-white/10"
                    >
                      <IconX size={14} className="mx-auto" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}