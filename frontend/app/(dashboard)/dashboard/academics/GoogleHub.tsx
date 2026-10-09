"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  IconAlertCircle,
  IconBrandGoogle,
  IconBrandGoogleDrive,
  IconCalendar,
  IconExternalLink,
  IconFileText,
  IconMail,
  IconRefresh,
  IconSchool,
  IconVideo,
} from "@tabler/icons-react";

import {
  clearToken,
  connectGoogle,
  fetchAssignments,
  fetchDriveFiles,
  fetchEvents,
  fetchInbox,
  hasToken,
  isNeedsConnect,
  isPopupDismissed,
  type Assignment,
  type CalEvent,
  type DriveFile,
  type GService,
  type MailItem,
} from "@/lib/google";
import { openExternal } from "@/lib/openExternal";

const CARD = "card dark:bg-gradient-to-b dark:from-white/[0.05] dark:to-transparent";

export type HubTab = GService;

const TABS: { id: HubTab; label: string; icon: typeof IconMail; url: string; color: string }[] = [
  { id: "calendar", label: "Calendar", icon: IconCalendar, url: "https://calendar.google.com", color: "#4285f4" },
  { id: "classroom", label: "Classroom", icon: IconSchool, url: "https://classroom.google.com", color: "#0f9d58" },
  { id: "gmail", label: "Gmail", icon: IconMail, url: "https://mail.google.com", color: "#ea4335" },
  { id: "drive", label: "Drive", icon: IconBrandGoogleDrive, url: "https://drive.google.com", color: "#34a853" },
];

/* ------------------------------------------------------------------ */
/* External link                                                       */
/* ------------------------------------------------------------------ */

function ExtLink({
  href,
  className,
  title,
  children,
}: {
  href?: string | null;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={className}
      onClick={(e) => {
        if (!href) return;
        e.preventDefault();
        e.stopPropagation();
        void openExternal(href);
      }}
    >
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const shortFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

function relativeDue(ms: number) {
  const diff = ms - Date.now();
  const days = Math.round(diff / 86_400_000);
  if (diff < 0) return `Overdue · ${shortFmt.format(ms)}`;
  if (days === 0) return `Due today · ${timeFmt.format(ms)}`;
  if (days === 1) return `Due tomorrow · ${timeFmt.format(ms)}`;
  return `Due ${dayFmt.format(ms)}`;
}

/* ------------------------------------------------------------------ */
/* Data hook                                                           */
/* ------------------------------------------------------------------ */

type State<T> =
  | { status: "checking" }
  | { status: "needs-connect"; note?: string }
  | { status: "loading"; data?: T }
  | { status: "ready"; data: T }
  | { status: "error"; error: string };

function useGoogle<T>(service: GService, loader: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ status: "checking" });

  const load = useCallback(async () => {
    setState((s) => ({ status: "loading", data: s.status === "ready" ? s.data : undefined }));
    try {
      setState({ status: "ready", data: await loader() });
    } catch (e) {
      if (isNeedsConnect(e)) setState({ status: "needs-connect", note: "Your Google session expired. Reconnect to continue." });
      else setState({ status: "error", error: e instanceof Error ? e.message : "Something went wrong." });
    }
  }, [loader]);

  useEffect(() => {
    setState({ status: "checking" });
    if (hasToken(service)) void load();
    else setState({ status: "needs-connect" });
  }, [service, load]);

  // Must run straight from the click so the browser allows the popup.
  const connect = useCallback(async () => {
    try {
      await connectGoogle(service);
      await load();
    } catch (e) {
      if (isPopupDismissed(e)) return;
      const code = (e as { code?: string })?.code;
      const msg =
        code === "auth/user-mismatch"
          ? "That Google account doesn't match the one you signed in with."
          : code === "auth/credential-already-in-use"
            ? "That Google account is already linked to another Nocturne account."
            : e instanceof Error
              ? e.message
              : "Could not connect to Google.";
      setState({ status: "error", error: msg });
    }
  }, [service, load]);

  const disconnect = useCallback(() => {
    clearToken(service);
    setState({ status: "needs-connect" });
  }, [service]);

  return { state, connect, reload: load, disconnect };
}

/* ------------------------------------------------------------------ */
/* Generic panel                                                       */
/* ------------------------------------------------------------------ */

function ServicePanel<T>({
  service,
  label,
  loader,
  empty,
  keyOf,
  renderItem,
}: {
  service: GService;
  label: string;
  loader: () => Promise<T[]>;
  empty: string;
  keyOf: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}) {
  const { state, connect, reload, disconnect } = useGoogle(service, loader);

  if (state.status === "checking") {
    return (
      <div className="space-y-2 p-4">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="h-14 animate-pulse rounded-2xl bg-surface-alt dark:bg-white/5" />
        ))}
      </div>
    );
  }

  if (state.status === "needs-connect") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-lavender/10 text-lavender-dark">
          <IconBrandGoogle size={30} />
        </span>
        <div>
          <h3 className="text-base font-bold">Connect Google {label}</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
            {state.note ??
              `Nocturne will only read your ${label.toLowerCase()}, never change anything. You can revoke access any time at myaccount.google.com/permissions.`}
          </p>
        </div>
        <button
          type="button"
          onClick={connect}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-[13px] font-semibold text-white shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
        >
          <IconBrandGoogle size={16} />
          Connect with Google
        </button>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <IconAlertCircle size={28} className="text-coral" />
        <p className="max-w-md break-words text-[13px] text-ink-secondary dark:text-ink-secondary-dark">{state.error}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reload}
            className="rounded-xl bg-surface-alt px-4 py-2 text-[13px] font-semibold dark:bg-white/10"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={connect}
            className="rounded-xl bg-surface-alt px-4 py-2 text-[13px] font-semibold dark:bg-white/10"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  const items = state.data ?? [];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-3">
        <button
          type="button"
          onClick={disconnect}
          className="text-[11.5px] text-ink-muted hover:underline dark:text-ink-muted-dark"
        >
          Disconnect
        </button>
        <button
          type="button"
          title="Refresh"
          onClick={reload}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-white/10"
        >
          <IconRefresh size={16} className={state.status === "loading" ? "animate-spin" : ""} />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-ink-muted dark:text-ink-muted-dark">{empty}</p>
        ) : (
          items.map((item) => <div key={keyOf(item)}>{renderItem(item)}</div>)
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

const ROW =
  "flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-surface-alt/70 dark:hover:bg-white/5";

function EventRow({ e }: { e: CalEvent }) {
  return (
    <div className={ROW}>
      <div className="w-16 shrink-0 pt-0.5 text-[11.5px] font-semibold text-ink-muted dark:text-ink-muted-dark">
        {dayFmt.format(e.start)}
      </div>
      <ExtLink href={e.link ?? "https://calendar.google.com"} className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{e.title}</span>
        <span className="block truncate text-[11.5px] text-ink-muted dark:text-ink-muted-dark">
          {e.allDay ? "All day" : timeFmt.format(e.start)}
          {e.location ? ` · ${e.location}` : ""}
        </span>
      </ExtLink>
      {e.meetLink && (
        <ExtLink
          href={e.meetLink}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-mint/15 px-2.5 py-1 text-[11px] font-semibold text-mint"
        >
          <IconVideo size={13} /> Join
        </ExtLink>
      )}
    </div>
  );
}

function AssignmentRow({ a }: { a: Assignment }) {
  return (
    <ExtLink href={a.link ?? "https://classroom.google.com"} className={ROW}>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0f9d5822] text-[#0f9d58]">
        <IconSchool size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{a.title}</span>
        <span className="block truncate text-[11.5px] text-ink-muted dark:text-ink-muted-dark">{a.course}</span>
      </span>
      <span
        className={`shrink-0 pt-0.5 text-[11.5px] font-semibold ${a.overdue ? "text-coral" : "text-ink-secondary dark:text-ink-secondary-dark"}`}
      >
        {a.due ? relativeDue(a.due) : "No due date"}
      </span>
    </ExtLink>
  );
}

function MailRow({ m }: { m: MailItem }) {
  return (
    <ExtLink href={m.link} className={ROW}>
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.unread ? "bg-lavender-dark" : "bg-transparent"}`}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-[13px] ${m.unread ? "font-bold" : "font-semibold"}`}>{m.from}</span>
          <span className="shrink-0 text-[11px] text-ink-muted dark:text-ink-muted-dark">
            {shortFmt.format(m.date)}
          </span>
        </span>
        <span className={`block truncate text-[12.5px] ${m.unread ? "font-semibold" : ""}`}>{m.subject}</span>
        <span className="block truncate text-[11.5px] text-ink-muted dark:text-ink-muted-dark">{m.snippet}</span>
      </span>
    </ExtLink>
  );
}

function FileRow({ f }: { f: DriveFile }) {
  return (
    <ExtLink href={f.link ?? "https://drive.google.com"} className={ROW}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#34a85322] text-[#34a853]">
        <IconFileText size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{f.name}</span>
        <span className="block text-[11.5px] text-ink-muted dark:text-ink-muted-dark">
          Edited {shortFmt.format(f.modified)}
        </span>
      </span>
    </ExtLink>
  );
}

/* ------------------------------------------------------------------ */
/* Hub                                                                 */
/* ------------------------------------------------------------------ */

export default function GoogleHub({
  tab,
  onTabChange,
}: {
  tab: HubTab;
  onTabChange: (t: HubTab) => void;
}) {
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className={`${CARD} flex h-[calc(100vh-250px)] min-h-[520px] min-w-0 flex-col overflow-hidden p-0`}>
      <div className="flex items-center gap-1 border-b border-line px-2 py-1.5 dark:border-line-dark">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  active
                    ? "bg-lavender/15 text-ink-primary dark:text-ink-primary-dark"
                    : "text-ink-secondary hover:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-white/5"
                }`}
              >
                <span style={{ color: t.color }}>
                  <Icon size={15} stroke={1.9} />
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
        <ExtLink
          href={current.url}
          title={`Open ${current.label} in Google`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-white/10"
        >
          <IconExternalLink size={16} />
        </ExtLink>
      </div>

      <div className="min-h-0 flex-1">
        {tab === "calendar" && (
          <ServicePanel<CalEvent>
            key="calendar"
            service="calendar"
            label="Calendar"
            loader={fetchEvents}
            empty="Nothing scheduled in the next 14 days."
            keyOf={(e) => e.id}
            renderItem={(e) => <EventRow e={e} />}
          />
        )}
        {tab === "classroom" && (
          <ServicePanel<Assignment>
            key="classroom"
            service="classroom"
            label="Classroom"
            loader={fetchAssignments}
            empty="All caught up. No pending assignments."
            keyOf={(a) => a.id}
            renderItem={(a) => <AssignmentRow a={a} />}
          />
        )}
        {tab === "gmail" && (
          <ServicePanel<MailItem>
            key="gmail"
            service="gmail"
            label="Gmail"
            loader={fetchInbox}
            empty="Your inbox is empty."
            keyOf={(m) => m.id}
            renderItem={(m) => <MailRow m={m} />}
          />
        )}
        {tab === "drive" && (
          <ServicePanel<DriveFile>
            key="drive"
            service="drive"
            label="Drive"
            loader={fetchDriveFiles}
            empty="No recent files."
            keyOf={(f) => f.id}
            renderItem={(f) => <FileRow f={f} />}
          />
        )}
      </div>
    </div>
  );
}