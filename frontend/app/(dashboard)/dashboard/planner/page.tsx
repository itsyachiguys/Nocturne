"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  IconCheck,
  IconFlame,
  IconMinus,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { SUBJECTS } from "@/lib/academic-data";
import {
  DEFAULT_WEEKLY_TARGET,
  addFocusSession,
  addTask,
  deleteTask,
  setTaskDone,
  setWeeklyTarget,
  subscribeFocusSessions,
  subscribeTasks,
  subscribeWeeklyTarget,
  updateTask,
  type FocusSession,
  type PlannerTask,
  type Priority,
  type TaskInput,
} from "@/lib/planner";
import {
  computeWeakTopics,
  subscribeAttempts,
  type QuizAttempt,
} from "@/lib/quizzes";

const FIELD =
  "w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark";
const MUTED = "text-sm text-ink-secondary dark:text-ink-secondary-dark";
const H4 =
  "text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark";

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-coral/10 text-coral",
  medium: "bg-pastel-orange/10 text-pastel-orange",
  low: "bg-mint/10 text-mint",
};

/* ------------------------------ helpers ------------------------------ */

function localISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
}

function dueLabel(due: string, today: string) {
  if (!due) return "No due date";
  if (due === today) return "Due today";
  const t = new Date();
  t.setDate(t.getDate() + 1);
  if (due === localISO(t)) return "Due tomorrow";
  const [y, m, d] = due.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return due < today ? `Overdue • ${label}` : `Due ${label}`;
}

function fmtMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

// not done first, then high priority first, then earliest due date
const byStatusPriorityDue = (a: PlannerTask, b: PlannerTask) =>
  Number(a.done) - Number(b.done) ||
  PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
  (a.due || "9999-12-31").localeCompare(b.due || "9999-12-31");

// undefined = auth still loading, null = signed out, string = uid.
function useUid() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  useEffect(
    () => onAuthStateChanged(getAuth(), (u) => setUid(u?.uid ?? null)),
    []
  );
  return uid;
}

/* ------------------------------ Pomodoro ----------------------------- */

const FOCUS_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

function Pomodoro({
  tasks,
  onFocusComplete,
}: {
  tasks: PlannerTask[];
  onFocusComplete: (taskId: string) => void;
}) {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [left, setLeft] = useState(FOCUS_SEC);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState("");
  const endAt = useRef(0);

  // Keep the latest callback/selection available inside the timer effect.
  const cbRef = useRef(onFocusComplete);
  const taskRef = useRef(taskId);
  useEffect(() => {
    cbRef.current = onFocusComplete;
    taskRef.current = taskId;
  });

  const openTasks = tasks.filter((t) => !t.done);
  const selectedId = openTasks.some((t) => t.id === taskId) ? taskId : "";

  // Tick from a fixed end time so background-tab throttling doesn't drift.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  // When a session ends: record finished focus sessions, then queue the other mode.
  useEffect(() => {
    if (left > 0) return;
    if (mode === "focus") cbRef.current(taskRef.current);
    const next = mode === "focus" ? "break" : "focus";
    setRunning(false);
    setMode(next);
    setLeft(next === "focus" ? FOCUS_SEC : BREAK_SEC);
  }, [left, mode]);

  function start() {
    endAt.current = Date.now() + left * 1000;
    setRunning(true);
  }

  function switchMode(next: "focus" | "break") {
    setRunning(false);
    setMode(next);
    setLeft(next === "focus" ? FOCUS_SEC : BREAK_SEC);
  }

  const total = mode === "focus" ? FOCUS_SEC : BREAK_SEC;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const label = running
    ? "Pause"
    : left === total
    ? mode === "focus"
      ? "Start Focus"
      : "Start Break"
    : "Resume";

  return (
    <div className="card p-6 text-center">
      <h4 className={`mb-4 ${H4}`}>Pomodoro Timer</h4>

      <div className="mb-4 flex justify-center gap-2">
        {(["focus", "break"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              mode === m
                ? "bg-lavender/20 text-lavender-dark"
                : "text-ink-secondary dark:text-ink-secondary-dark"
            }`}
          >
            {m === "focus" ? "Focus 25" : "Break 5"}
          </button>
        ))}
      </div>

      <select
        name="focus-task"
        value={selectedId}
        onChange={(e) => setTaskId(e.target.value)}
        className={`${FIELD} mb-4 text-center`}
        aria-label="Task to focus on"
      >
        <option value="">General focus (no task)</option>
        {openTasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>

      <p className="font-display text-6xl font-bold tracking-tighter text-lavender-dark mb-2">
        {mm}:{ss}
      </p>
      <p className={`mb-6 ${MUTED}`}>
        {mode === "focus" ? "Focus Session" : "Break Time"}
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={running ? () => setRunning(false) : start}
          className="btn-primary flex items-center gap-2 px-8 py-3"
        >
          {running ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
          {label}
        </button>
        <button
          type="button"
          onClick={() => switchMode(mode)}
          aria-label="Reset timer"
          className="rounded-2xl border border-line p-3 dark:border-line-dark"
        >
          <IconRefresh size={18} />
        </button>
      </div>

      <p className="mt-4 text-xs text-ink-secondary dark:text-ink-secondary-dark">
        Only completed 25-minute focus sessions are counted.
      </p>
    </div>
  );
}

/* ----------------------------- Task editor --------------------------- */

function TaskEditor({
  task,
  onSave,
  onCancel,
}: {
  task: PlannerTask;
  onSave: (input: TaskInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [subjectId, setSubjectId] = useState(task.subjectId);
  const [due, setDue] = useState(task.due);
  const [priority, setPriority] = useState<Priority>(task.priority);

  return (
    <div className="space-y-3 border-b border-line pb-4 dark:border-line-dark">
      <input
        name="edit-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={FIELD}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          name="edit-subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className={FIELD}
        >
          <option value="">No subject</option>
          {SUBJECTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          name="edit-due"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className={FIELD}
        />
        <select
          name="edit-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className={FIELD}
        >
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!title.trim()}
          onClick={() => onSave({ title: title.trim(), subjectId, due, priority })}
          className="btn-primary px-4 py-2 text-xs disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-line px-4 py-2 text-xs font-semibold dark:border-line-dark"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ Task row ----------------------------- */

function TaskRow({
  task,
  today,
  focusMinutes,
  editing,
  onToggle,
  onDelete,
  onEdit,
  onSave,
  onCancel,
}: {
  task: PlannerTask;
  today: string;
  focusMinutes: number;
  editing: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSave: (input: TaskInput) => void;
  onCancel: () => void;
}) {
  if (editing) {
    return <TaskEditor task={task} onSave={onSave} onCancel={onCancel} />;
  }

  const subject = SUBJECTS.find((s) => s.id === task.subjectId)?.name;
  const overdue = !task.done && !!task.due && task.due < today;

  return (
    <div className="flex items-start gap-4 border-b border-line pb-4 last:border-none dark:border-line-dark">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={`Mark "${task.title}" ${task.done ? "not done" : "done"}`}
        onClick={onToggle}
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
          task.done
            ? "border-mint bg-mint"
            : "border-line hover:border-lavender dark:border-line-dark"
        }`}
      >
        {task.done && <IconCheck size={14} className="text-white" />}
      </button>

      <div className={`flex-1 ${task.done ? "opacity-60" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-[15px] ${task.done ? "line-through" : ""}`}>
            {task.title}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_STYLE[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>
        <p
          className={`mt-0.5 text-xs ${
            overdue
              ? "text-coral"
              : "text-ink-secondary dark:text-ink-secondary-dark"
          }`}
        >
          {subject ? `${subject} • ` : ""}
          {dueLabel(task.due, today)}
          {focusMinutes > 0 ? ` • ${fmtMinutes(focusMinutes)} focused` : ""}
        </p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${task.title}`}
        className="rounded-xl p-2 text-ink-secondary hover:bg-lavender/10 dark:text-ink-secondary-dark"
      >
        <IconPencil size={16} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${task.title}`}
        className="rounded-xl p-2 text-coral hover:bg-coral/10"
      >
        <IconTrash size={16} />
      </button>
    </div>
  );
}

/* -------------------------------- Page ------------------------------- */

export default function PlannerPage() {
  const uid = useUid();

  const [tasks, setTasks] = useState<PlannerTask[] | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[] | null>(null);
  const [target, setTarget] = useState(DEFAULT_WEEKLY_TARGET);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const today = localISO(new Date());
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [due, setDue] = useState(today);
  const [priority, setPriority] = useState<Priority>("medium");

  useEffect(() => {
    if (!uid) return;
    const onErr = (label: string) => (e: Error) => {
      console.error(label, e);
      setLoadError(true);
    };
    const unsubs = [
      subscribeTasks(
        uid,
        (list) => {
          setTasks(list);
          setLoadError(false);
        },
        onErr("subscribeTasks")
      ),
      subscribeFocusSessions(uid, setSessions, onErr("subscribeFocusSessions")),
      subscribeWeeklyTarget(uid, setTarget, onErr("subscribeWeeklyTarget")),
      subscribeAttempts(uid, setAttempts, onErr("subscribeAttempts")),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const fail = (label: string, msg: string) => (e: unknown) => {
    console.error(label, e);
    setActionError(msg);
  };

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!uid || !t) return;
    setActionError(null);
    // Not awaited: the list updates instantly from the local cache.
    addTask(uid, { title: t, subjectId, due, priority }).catch(
      fail("addTask", "Couldn't save the task. Check your connection.")
    );
    setTitle("");
  }

  function handleToggle(task: PlannerTask) {
    if (!uid) return;
    setTaskDone(uid, task.id, !task.done).catch(
      fail("setTaskDone", "Couldn't update the task.")
    );
  }

  function handleDelete(task: PlannerTask) {
    if (!uid) return;
    deleteTask(uid, task.id).catch(
      fail("deleteTask", "Couldn't delete the task.")
    );
  }

  function handleSave(task: PlannerTask, input: TaskInput) {
    if (!uid) return;
    setEditingId(null);
    updateTask(uid, task.id, input).catch(
      fail("updateTask", "Couldn't save your changes.")
    );
  }

  function handleFocusComplete(taskId: string) {
    if (!uid) return;
    const task = (tasks ?? []).find((t) => t.id === taskId);
    addFocusSession(uid, {
      taskId,
      subjectId: task?.subjectId ?? "",
      minutes: 25,
    }).catch(fail("addFocusSession", "Couldn't save your focus session."));
  }

  function addReviewTask(topic: string) {
    if (!uid) return;
    addTask(uid, {
      title: `Review: ${topic}`,
      subjectId: "",
      due: today,
      priority: "high",
    }).catch(fail("addTask", "Couldn't add the review task."));
  }

  function changeTarget(delta: number) {
    if (!uid) return;
    const next = Math.min(99, Math.max(1, target + delta));
    setTarget(next);
    setWeeklyTarget(uid, next).catch(
      fail("setWeeklyTarget", "Couldn't save your weekly goal.")
    );
  }

  const { todayTasks, upcoming, completedThisWeek } = useMemo(() => {
    const all = tasks ?? [];
    const weekStart = startOfWeek();
    return {
      todayTasks: all
        .filter((t) => !t.due || t.due <= today)
        .sort(byStatusPriorityDue),
      upcoming: all.filter((t) => t.due > today).sort(byStatusPriorityDue),
      completedThisWeek: all.filter(
        (t) => t.done && t.completedAt && t.completedAt >= weekStart
      ).length,
    };
  }, [tasks, today]);

  // Study-time stats from saved focus sessions.
  const stats = useMemo(() => {
    const weekStart = startOfWeek();
    const days = new Set<string>();
    const byTask = new Map<string, number>();
    const bySubject = new Map<string, number>();
    let todayMin = 0;
    let weekMin = 0;

    for (const s of sessions) {
      if (!s.completedAt) continue;
      const key = localISO(s.completedAt);
      days.add(key);
      if (s.taskId) byTask.set(s.taskId, (byTask.get(s.taskId) ?? 0) + s.minutes);
      if (key === today) todayMin += s.minutes;
      if (s.completedAt >= weekStart) {
        weekMin += s.minutes;
        bySubject.set(s.subjectId, (bySubject.get(s.subjectId) ?? 0) + s.minutes);
      }
    }

    // streak = consecutive days with a session, ending today (or yesterday)
    let streak = 0;
    const cursor = new Date();
    if (!days.has(localISO(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(localISO(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const subjects = [...bySubject.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    return { todayMin, weekMin, streak, byTask, subjects };
  }, [sessions, today]);

  const suggestions = useMemo(() => {
    if (!attempts) return [];
    const open = new Set(
      (tasks ?? []).filter((t) => !t.done).map((t) => t.title)
    );
    return computeWeakTopics(attempts)
      .filter((topic) => !open.has(`Review: ${topic}`))
      .slice(0, 4);
  }, [attempts, tasks]);

  const goalPct = Math.min(100, Math.round((completedThisWeek / target) * 100));
  const subjectLabel = (id: string) =>
    SUBJECTS.find((s) => s.id === id)?.name ?? "General";
  const maxSubjectMin = stats.subjects[0]?.[1] ?? 1;

  const renderRows = (list: PlannerTask[]) => (
    <div className="space-y-4">
      {list.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          today={today}
          focusMinutes={stats.byTask.get(t.id) ?? 0}
          editing={editingId === t.id}
          onToggle={() => handleToggle(t)}
          onDelete={() => handleDelete(t)}
          onEdit={() => setEditingId(t.id)}
          onSave={(input) => handleSave(t, input)}
          onCancel={() => setEditingId(null)}
        />
      ))}
    </div>
  );

  return (
    <>
      <PageHeader title="Planner" subtitle="Today's tasks and weekly goals" />

      {loadError && (
        <p className="mb-4 text-sm text-coral">
          Couldn&apos;t load your planner. Check your connection and
          permissions.
        </p>
      )}
      {actionError && <p className="mb-4 text-sm text-coral">{actionError}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {/* Add task */}
          <div className="card p-6">
            <h4 className={`mb-4 ${H4}`}>Add a Task</h4>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                name="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you need to do?"
                className={FIELD}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select
                  name="task-subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className={FIELD}
                >
                  <option value="">No subject</option>
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  name="task-due"
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className={FIELD}
                />
                <select
                  name="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className={FIELD}
                >
                  <option value="high">High priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="low">Low priority</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!uid || !title.trim()}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <IconPlus size={18} />
                Add task
              </button>
            </form>
          </div>

          {/* Today's Tasks */}
          <div className="card p-6">
            <h4 className={`mb-6 ${H4}`}>Today’s Tasks</h4>
            {tasks === null ? (
              <p className={MUTED}>{loadError ? "Unavailable." : "Loading..."}</p>
            ) : todayTasks.length === 0 ? (
              <p className={MUTED}>Nothing due today. Add a task above.</p>
            ) : (
              renderRows(todayTasks)
            )}
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="card p-6">
              <h4 className={`mb-6 ${H4}`}>Upcoming</h4>
              {renderRows(upcoming)}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Weekly Goal */}
          <div className="card p-6">
            <h4 className={`mb-5 ${H4}`}>Weekly Goal</h4>

            <div className="mb-4 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-lavender-dark">
                {completedThisWeek}
              </span>
              <span className="text-xl text-ink-secondary dark:text-ink-secondary-dark">
                / {target}
              </span>
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => changeTarget(-1)}
                  aria-label="Lower weekly goal"
                  className="rounded-lg border border-line p-1.5 dark:border-line-dark"
                >
                  <IconMinus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => changeTarget(1)}
                  aria-label="Raise weekly goal"
                  className="rounded-lg border border-line p-1.5 dark:border-line-dark"
                >
                  <IconPlus size={14} />
                </button>
              </span>
            </div>

            <div className="mb-2 h-2.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark">
              <div
                className="h-2.5 rounded-full bg-brand-gradient"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
              {goalPct}% completed • tasks finished this week
            </p>
          </div>

          <Pomodoro tasks={tasks ?? []} onFocusComplete={handleFocusComplete} />

          {/* Study time */}
          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h4 className={H4}>Study Time</h4>
              <span className="flex items-center gap-1 text-sm font-semibold text-pastel-orange">
                <IconFlame size={16} />
                {stats.streak} day{stats.streak === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-4">
              <div>
                <p className="font-display text-2xl font-bold text-lavender-dark">
                  {fmtMinutes(stats.todayMin)}
                </p>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                  Today
                </p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-lavender-dark">
                  {fmtMinutes(stats.weekMin)}
                </p>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                  This week
                </p>
              </div>
            </div>

            {stats.subjects.length === 0 ? (
              <p className={MUTED}>
                Finish a 25-minute focus session to start tracking your study
                time.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.subjects.map(([sid, min]) => (
                  <div key={sid || "general"}>
                    <div className="mb-1 flex justify-between text-xs text-ink-secondary dark:text-ink-secondary-dark">
                      <span>{subjectLabel(sid)}</span>
                      <span>{fmtMinutes(min)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark">
                      <div
                        className="h-2 rounded-full bg-brand-gradient"
                        style={{ width: `${Math.round((min / maxSubjectMin) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggested reviews from quizzes */}
          {suggestions.length > 0 && (
            <div className="card p-6">
              <h4 className={`mb-2 ${H4}`}>Suggested Reviews</h4>
              <p className={`mb-4 ${MUTED}`}>
                Topics where you scored under 60% in recent quizzes.
              </p>
              <div className="space-y-3">
                {suggestions.map((topic) => (
                  <div
                    key={topic}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-coral">
                      {topic}
                    </span>
                    <button
                      type="button"
                      onClick={() => addReviewTask(topic)}
                      className="rounded-xl border border-coral/30 px-3 py-1 text-xs font-semibold text-coral"
                    >
                      Add task
                    </button>
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard/quizzes"
                className="mt-4 inline-block text-xs font-semibold text-lavender-dark"
              >
                Practice with a quiz →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}