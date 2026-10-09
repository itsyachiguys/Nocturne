"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { UI } from "@/lib/obliqo/ui";
import { ACTIVITY_TARGET } from "@/lib/lifescore/calculator";
import {
  ACTIVITY_TYPES,
  addActivity,
  removeActivity,
  setActivityCompleted,
  subscribeActivities,
  type Activity,
  type ActivityType,
} from "@/lib/lifescore/activities";

export default function ActivitiesPage() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [items, setItems] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ActivityType>("course");
  const [completed, setCompleted] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(getAuth(), (u) => setUid(u ? u.uid : null)), []);
  useEffect(() => {
    if (!uid) return;
    return subscribeActivities(uid, setItems, (e) => {
      console.error("activities", e);
      setError(e.message);
      setItems([]);
    });
  }, [uid]);

  async function onAdd() {
    if (!uid || !title.trim() || busy) return;
    setBusy(true);
    try {
      await addActivity(uid, title, type, completed);
      setTitle("");
    } catch (e) {
      console.error("add activity", e);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (uid === null) return <div className={`${UI.card} p-6 text-sm`}>Please sign in to manage your activities.</div>;

  const done = items?.filter((i) => i.completed).length ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/dashboard" className={`text-sm ${UI.muted} hover:underline`}>Back to dashboard</Link>

      <section className={`${UI.card} space-y-1 p-5`}>
        <h1 className="text-xl font-semibold">Courses &amp; activities</h1>
        <p className={`text-sm ${UI.muted}`}>
          Add online courses, certifications, clubs, sports and anything else you do outside class. Each completed
          item counts toward your Life Score, and {ACTIVITY_TARGET} completed items earns the full 100% for this part.
        </p>
        <p className="text-sm font-medium">{done} completed so far</p>
      </section>

      <section className={`${UI.card} space-y-3 p-5`} aria-label="Add an activity">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="e.g. Python for Everybody (Coursera), Debate club, NSS camp"
          className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-white/10"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1c1730]"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} />
            Already completed
          </label>
          <button
            type="button"
            onClick={onAdd}
            disabled={!title.trim() || busy}
            className="ml-auto rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </section>

      <section className={`${UI.card} divide-y divide-slate-200 dark:divide-white/10`} aria-label="Your activities">
        {items === null ? (
          <p className={`p-4 text-sm ${UI.muted}`}>Loading...</p>
        ) : items.length === 0 ? (
          <p className={`p-4 text-sm ${UI.muted}`}>Nothing added yet. Your first entry switches this part of the Life Score on.</p>
        ) : (
          items.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3">
              <input
                type="checkbox"
                checked={a.completed}
                aria-label={`Mark ${a.title} as completed`}
                onChange={(e) => uid && setActivityCompleted(uid, a.id, e.target.checked).catch((err) => setError(err.message))}
              />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${a.completed ? "" : UI.muted}`}>{a.title}</p>
                <p className={`text-xs ${UI.muted}`}>
                  {ACTIVITY_TYPES.find((t) => t.value === a.type)?.label ?? "Other"}
                  {a.completed ? " · Completed" : " · In progress"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => uid && removeActivity(uid, a.id).catch((err) => setError(err.message))}
                className="rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-white/5"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
