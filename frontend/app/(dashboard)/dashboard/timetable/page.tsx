"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { IconPlus } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { SUBJECTS, WEEK_DAYS } from "@/lib/academic-data";
import {
  addEntry,
  deleteEntry,
  subscribeTimetable,
  updateEntry,
  type TimetableEntry,
} from "@/lib/timetable";

const HOUR_PX = 72; // height of one hour on the grid
const SHORT_DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const FIELD =
  "w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark";
const LABEL =
  "text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark";
const MUTED = "text-sm text-ink-secondary dark:text-ink-secondary-dark";

/* ------------------------------ helpers ------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

// "9:30" or "09:30" -> minutes since midnight
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// minutes -> "09:30" (the format <input type="time"> needs)
const toInput = (min: number) => {
  const c = Math.max(0, Math.min(min, 23 * 60 + 59));
  return `${pad(Math.floor(c / 60))}:${pad(c % 60)}`;
};

// minutes -> "9:30" (display)
const fmt = (min: number) => `${Math.floor(min / 60)}:${pad(min % 60)}`;

// [start, end] in minutes; older entries without an end time last 1 hour.
const span = (e: TimetableEntry): [number, number] => {
  const s = toMin(e.time);
  const en = e.endTime ? toMin(e.endTime) : s + 60;
  return [s, Math.max(en, s + 15)];
};

// Works whether WEEK_DAYS holds "Mon" or "Monday".
const dayMatches = (day: string, date: Date) =>
  day.slice(0, 3).toLowerCase() === SHORT_DAYS[date.getDay()];

// undefined = auth still loading, null = signed out, string = uid.
function useUid() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  useEffect(
    () => onAuthStateChanged(getAuth(), (u) => setUid(u?.uid ?? null)),
    []
  );
  return uid;
}

type FormState = {
  id: string | null; // null = adding a new class
  day: string;
  time: string; // start, "HH:MM"
  endTime: string; // end, "HH:MM"
  subjectId: string;
  room: string;
};

/* -------------------------------- Page ------------------------------- */

export default function TimetablePage() {
  const uid = useUid();

  const [entries, setEntries] = useState<TimetableEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Set after mount so server and client markup match (no hydration warning).
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!uid) return;
    return subscribeTimetable(
      uid,
      (list) => {
        setEntries(list);
        setLoadError(false);
      },
      (e) => {
        console.error("subscribeTimetable", e);
        setLoadError(true);
      }
    );
  }, [uid]);

  const subjectName = (id: string) =>
    SUBJECTS.find((s) => s.id === id)?.name ?? "Unknown subject";

  // Visible hours: 9:00 to 15:00 by default, grown to fit any class outside that.
  const { startHour, hours } = useMemo(() => {
    let lo = 9 * 60;
    let hi = 15 * 60;
    for (const e of entries ?? []) {
      const [s, en] = span(e);
      lo = Math.min(lo, s);
      hi = Math.max(hi, en);
    }
    const first = Math.floor(lo / 60);
    const last = Math.min(24, Math.max(Math.ceil(hi / 60), first + 1));
    return {
      startHour: first,
      hours: Array.from({ length: last - first }, (_, i) => first + i),
    };
  }, [entries]);

  // "Now" / "Next" class banner.
  const upNext = useMemo(() => {
    if (!now || !entries || entries.length === 0) return null;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (let off = 0; off < 7; off++) {
      const date = new Date(now);
      date.setDate(now.getDate() + off);
      const list = entries
        .filter((e) => dayMatches(e.day, date))
        .filter((e) => off > 0 || span(e)[1] > nowMin)
        .sort((a, b) => span(a)[0] - span(b)[0]);
      if (list.length > 0) {
        const e = list[0];
        const live = off === 0 && span(e)[0] <= nowMin;
        const when = off === 0 ? "Today" : off === 1 ? "Tomorrow" : e.day;
        return { entry: e, live, when };
      }
    }
    return null;
  }, [entries, now]);

  const fail = (label: string, msg: string) => (e: unknown) => {
    console.error(label, e);
    setActionError(msg);
  };

  function openAdd(day = WEEK_DAYS[0] ?? "", start = "09:00", end = "10:00") {
    setFormError(null);
    setForm({
      id: null,
      day,
      time: start,
      endTime: end,
      subjectId: SUBJECTS[0]?.id ?? "",
      room: "",
    });
  }

  function openEdit(e: TimetableEntry) {
    const [s, en] = span(e);
    setFormError(null);
    setForm({
      id: e.id,
      day: e.day,
      time: toInput(s),
      endTime: toInput(en),
      subjectId: e.subjectId,
      room: e.room,
    });
  }

  function changeStart(value: string) {
    if (!form) return;
    // If the end would be at or before the new start, keep a 1 hour class.
    const endTime =
      value && toMin(form.endTime) <= toMin(value)
        ? toInput(toMin(value) + 60)
        : form.endTime;
    setForm({ ...form, time: value, endTime });
  }

  function handleSave(ev: FormEvent) {
    ev.preventDefault();
    if (!uid || !form) return;
    if (!form.subjectId) {
      setFormError("Pick a subject.");
      return;
    }
    if (!form.time || !form.endTime) {
      setFormError("Set both a start and an end time.");
      return;
    }
    const s = toMin(form.time);
    const en = toMin(form.endTime);
    if (en <= s) {
      setFormError("The end time must be after the start time.");
      return;
    }
    const clash = (entries ?? []).find((x) => {
      if (x.day !== form.day || x.id === form.id) return false;
      const [xs, xe] = span(x);
      return s < xe && xs < en;
    });
    if (clash) {
      const [xs, xe] = span(clash);
      setFormError(
        `That overlaps ${subjectName(clash.subjectId)} on ${clash.day} (${fmt(xs)}-${fmt(xe)}). Change the time or edit that class first.`
      );
      return;
    }
    const input = {
      day: form.day,
      time: form.time,
      endTime: form.endTime,
      subjectId: form.subjectId,
      room: form.room.trim(),
    };
    setActionError(null);
    // Not awaited: the grid updates instantly from the local cache.
    (form.id ? updateEntry(uid, form.id, input) : addEntry(uid, input)).catch(
      fail("saveEntry", "Couldn't save the class. Check your connection.")
    );
    setForm(null);
  }

  function handleDelete() {
    if (!uid || !form?.id) return;
    if (!window.confirm("Delete this class from your timetable?")) return;
    deleteEntry(uid, form.id).catch(
      fail("deleteEntry", "Couldn't delete the class.")
    );
    setForm(null);
  }

  const totalPx = hours.length * HOUR_PX;

  return (
    <>
      <PageHeader title="Timetable" subtitle="Weekly class schedule" />

      {loadError && (
        <p className="mb-4 text-sm text-coral">
          Couldn&apos;t load your timetable. Check your connection and
          permissions.
        </p>
      )}
      {actionError && <p className="mb-4 text-sm text-coral">{actionError}</p>}

      {upNext && (
        <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              upNext.live
                ? "bg-mint/10 text-mint"
                : "bg-lavender/10 text-lavender-dark"
            }`}
          >
            {upNext.live ? "Now" : "Next"}
          </span>
          <p className="text-sm text-ink-primary dark:text-ink-primary-dark">
            <span className="font-semibold">
              {subjectName(upNext.entry.subjectId)}
            </span>
            {upNext.entry.room ? ` • ${upNext.entry.room}` : ""} •{" "}
            {upNext.when} {fmt(span(upNext.entry)[0])}-
            {fmt(span(upNext.entry)[1])}
          </p>
        </div>
      )}

      {form && (
        <form onSubmit={handleSave} className="card mb-6 space-y-4 p-6">
          <h4 className="text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
            {form.id ? "Edit Class" : "Add a Class"}
          </h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Subject</span>
              <select
                name="class-subject"
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className={`mt-1 ${FIELD}`}
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={LABEL}>Room</span>
              <input
                name="class-room"
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="e.g. Room 204"
                className={`mt-1 ${FIELD}`}
              />
            </label>

            <label className="block">
              <span className={LABEL}>Day</span>
              <select
                name="class-day"
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                className={`mt-1 ${FIELD}`}
              >
                {WEEK_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className={LABEL}>Start time</span>
                <input
                  name="class-start"
                  type="time"
                  step={300}
                  required
                  value={form.time}
                  onChange={(e) => changeStart(e.target.value)}
                  className={`mt-1 ${FIELD}`}
                />
              </label>
              <label className="block">
                <span className={LABEL}>End time</span>
                <input
                  name="class-end"
                  type="time"
                  step={300}
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className={`mt-1 ${FIELD}`}
                />
              </label>
            </div>
          </div>

          {formError && <p className="text-sm text-coral">{formError}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!uid}
              className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60"
            >
              {form.id ? "Save changes" : "Add class"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold dark:border-line-dark"
            >
              Cancel
            </button>
            {form.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="ml-auto rounded-xl px-5 py-2.5 text-sm font-semibold text-coral hover:bg-coral/10"
              >
                Delete class
              </button>
            )}
          </div>
        </form>
      )}

      <div className="card overflow-x-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className={MUTED}>
            {entries === null
              ? loadError
                ? "Unavailable."
                : "Loading..."
              : entries.length === 0
              ? "No classes yet. Click any free slot to add one."
              : "Click a class to edit it, or a free slot to add one."}
          </p>
          <button
            type="button"
            onClick={() => openAdd()}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <IconPlus size={16} />
            Add class
          </button>
        </div>

        <div
          className="grid min-w-[700px] gap-x-3 gap-y-2"
          style={{
            gridTemplateColumns: `100px repeat(${WEEK_DAYS.length}, 1fr)`,
          }}
        >
          {/* Header */}
          <div></div>
          {WEEK_DAYS.map((day) => {
            const isToday = !!now && dayMatches(day, now);
            return (
              <div
                key={day}
                className={`pb-2 text-center text-sm font-semibold ${
                  isToday
                    ? "text-lavender-dark"
                    : "text-ink-primary dark:text-ink-primary-dark"
                }`}
              >
                {day}
                {isToday && (
                  <span className="mx-auto mt-1 block h-1 w-6 rounded-full bg-lavender" />
                )}
              </div>
            );
          })}

          {/* Hour labels */}
          <div
            className="border-r border-line dark:border-line-dark"
            style={{ height: totalPx }}
          >
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_PX }}
                className="pr-4 pt-3 text-right text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark"
              >
                {h}:00
              </div>
            ))}
          </div>

          {/* One column per day: free slots underneath, classes drawn on top */}
          {WEEK_DAYS.map((day) => {
            const isToday = !!now && dayMatches(day, now);
            const dayEntries = (entries ?? []).filter((e) => e.day === day);
            return (
              <div
                key={day}
                className={`relative rounded-2xl ${
                  isToday ? "bg-lavender/5" : ""
                }`}
                style={{ height: totalPx }}
              >
                {hours.map((h) => {
                  // Don't draw a free slot under an hour that a class covers.
                  const covered = dayEntries.some((e) => {
                    const [s, en] = span(e);
                    return s < (h + 1) * 60 && en > h * 60;
                  });
                  return (
                    <div key={h} style={{ height: HOUR_PX }} className="p-1">
                      {!covered && (
                        <button
                          type="button"
                          onClick={() =>
                            openAdd(day, toInput(h * 60), toInput(h * 60 + 60))
                          }
                          aria-label={`Add a class on ${day} at ${h}:00`}
                          className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-line hover:border-lavender dark:border-line-dark"
                        >
                          <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
                            Free
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}

                {dayEntries.map((e) => {
                  const [s, en] = span(e);
                  const top = ((s - startHour * 60) / 60) * HOUR_PX + 4;
                  const height = Math.max(32, ((en - s) / 60) * HOUR_PX - 8);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => openEdit(e)}
                      style={{ top, height, left: 4, right: 4 }}
                      className="absolute overflow-hidden rounded-2xl border border-lavender/30 bg-lavender/10 p-3 text-left hover:border-lavender"
                    >
                      <p className="truncate text-[14px] font-semibold text-lavender-dark">
                        {subjectName(e.subjectId)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-secondary dark:text-ink-secondary-dark">
                        {fmt(s)}-{fmt(en)}
                        {e.room ? ` • ${e.room}` : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}