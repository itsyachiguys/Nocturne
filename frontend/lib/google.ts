import {
  GoogleAuthProvider,
  getAuth,
  linkWithPopup,
  reauthenticateWithPopup,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";

/* ------------------------------------------------------------------ */
/* Services + scopes (all read-only)                                   */
/* ------------------------------------------------------------------ */

export type GService = "calendar" | "classroom" | "gmail" | "drive";

export const SCOPES: Record<GService, string[]> = {
  calendar: ["https://www.googleapis.com/auth/calendar.readonly"],
  classroom: [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  ],
  gmail: ["https://www.googleapis.com/auth/gmail.readonly"],
  drive: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
};

/* ------------------------------------------------------------------ */
/* Access-token handling                                               */
/*                                                                     */
/* Firebase only hands you the Google OAuth access token at the moment */
/* of sign-in (it does not store or refresh it). Tokens last ~1 hour,  */
/* so we keep them in memory + sessionStorage (cleared on tab close)   */
/* and ask the user to reconnect when one expires. Never put these in  */
/* Firestore or localStorage.                                          */
/* ------------------------------------------------------------------ */

const TTL_MS = 55 * 60 * 1000;
const mem = new Map<string, { token: string; exp: number }>();

const cacheKey = (service: GService) =>
  `nocturne.g.${getAuth().currentUser?.uid ?? "anon"}.${service}`;

function readCache(service: GService): string | null {
  const k = cacheKey(service);
  const m = mem.get(k);
  if (m && m.exp > Date.now()) return m.token;
  try {
    const raw = sessionStorage.getItem(k);
    if (raw) {
      const v = JSON.parse(raw) as { token: string; exp: number };
      if (v.exp > Date.now()) {
        mem.set(k, v);
        return v.token;
      }
      sessionStorage.removeItem(k);
    }
  } catch {
    /* storage unavailable */
  }
  return null;
}

function writeCache(service: GService, token: string) {
  const k = cacheKey(service);
  const v = { token, exp: Date.now() + TTL_MS };
  mem.set(k, v);
  try {
    sessionStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export function clearToken(service: GService) {
  const k = cacheKey(service);
  mem.delete(k);
  try {
    sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

export const hasToken = (service: GService) => readCache(service) !== null;

/** Email of the linked Google account (used to open the right Gmail inbox). */
export function googleEmail(): string | null {
  const p = getAuth().currentUser?.providerData.find((x) => x.providerId === "google.com");
  return p?.email ?? null;
}

const needsConnect = () =>
  Object.assign(new Error("Connect your Google account to continue."), { code: "needs-connect" });

export const isNeedsConnect = (e: unknown) => (e as { code?: string })?.code === "needs-connect";

export const isPopupDismissed = (e: unknown) => {
  const c = (e as { code?: string })?.code;
  return c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request";
};

/**
 * Opens the Google consent popup for one service and caches the token.
 * IMPORTANT: call this directly from a click handler, with no `await`
 * before it, or the browser will block the popup.
 */
export async function connectGoogle(service: GService): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;
  const provider = new GoogleAuthProvider();
  SCOPES[service].forEach((s) => provider.addScope(s));

  const hint = googleEmail();
  provider.setCustomParameters({
    include_granted_scopes: "true",
    ...(hint ? { login_hint: hint } : {}),
  });

  let result: UserCredential;
  if (!user) {
    result = await signInWithPopup(auth, provider);
  } else if (user.providerData.some((p) => p.providerId === "google.com")) {
    result = await reauthenticateWithPopup(user, provider);
  } else {
    result = await linkWithPopup(user, provider);
  }

  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (!token) throw new Error("Google did not return an access token.");
  writeCache(service, token);
  return token;
}

async function gfetch<T>(service: GService, url: string): Promise<T> {
  const token = readCache(service);
  if (!token) throw needsConnect();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) {
    clearToken(service);
    throw needsConnect();
  }
  if (!res.ok) {
    let msg = `Google API error (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

export type CalEvent = {
  id: string;
  title: string;
  start: number; // ms
  allDay: boolean;
  location?: string;
  link?: string;
  meetLink?: string;
};

type RawEvent = {
  id: string;
  summary?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start: { dateTime?: string; date?: string };
};

export async function fetchEvents(): Promise<CalEvent[]> {
  const now = new Date();
  const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const qs = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "30",
  });
  const data = await gfetch<{ items?: RawEvent[] }>(
    "calendar",
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${qs}`
  );
  return (data.items ?? []).map((e) => {
    const allDay = !e.start.dateTime;
    return {
      id: e.id,
      title: e.summary ?? "(No title)",
      start: allDay ? new Date(`${e.start.date}T00:00:00`).getTime() : new Date(e.start.dateTime!).getTime(),
      allDay,
      location: e.location,
      link: e.htmlLink,
      meetLink: e.hangoutLink,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Classroom (student view: assignments not yet turned in)             */
/* ------------------------------------------------------------------ */

export type Assignment = {
  id: string;
  course: string;
  title: string;
  due: number | null; // ms
  overdue: boolean;
  link?: string;
};

type RawCourse = { id: string; name: string };
type RawWork = {
  id: string;
  title: string;
  alternateLink?: string;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours?: number; minutes?: number };
};
type RawSub = { courseWorkId: string; state: string };

function dueMs(w: RawWork): number | null {
  if (!w.dueDate) return null;
  const { year, month, day } = w.dueDate;
  if (w.dueTime && (w.dueTime.hours !== undefined || w.dueTime.minutes !== undefined)) {
    // Classroom stores due times in UTC.
    return Date.UTC(year, month - 1, day, w.dueTime.hours ?? 0, w.dueTime.minutes ?? 0);
  }
  return new Date(year, month - 1, day, 23, 59).getTime();
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const base = "https://classroom.googleapis.com/v1";
  const c = await gfetch<{ courses?: RawCourse[] }>(
    "classroom",
    `${base}/courses?courseStates=ACTIVE&studentId=me&pageSize=20`
  );
  const now = Date.now();
  const cutoff = now - 30 * 24 * 60 * 60 * 1000; // ignore anything overdue by more than 30 days

  const perCourse = await Promise.all(
    (c.courses ?? []).map(async (course) => {
      const [work, subs] = await Promise.all([
        gfetch<{ courseWork?: RawWork[] }>(
          "classroom",
          `${base}/courses/${course.id}/courseWork?courseWorkStates=PUBLISHED&pageSize=30`
        ),
        gfetch<{ studentSubmissions?: RawSub[] }>(
          "classroom",
          `${base}/courses/${course.id}/courseWork/-/studentSubmissions?userId=me&pageSize=100`
        ),
      ]);
      const state = new Map((subs.studentSubmissions ?? []).map((s) => [s.courseWorkId, s.state]));
      const out: Assignment[] = [];
      for (const w of work.courseWork ?? []) {
        const st = state.get(w.id);
        if (st === "TURNED_IN" || st === "RETURNED") continue;
        const due = dueMs(w);
        if (due !== null && due < cutoff) continue;
        out.push({
          id: `${course.id}-${w.id}`,
          course: course.name,
          title: w.title,
          due,
          overdue: due !== null && due < now,
          link: w.alternateLink,
        });
      }
      return out;
    })
  );

  return perCourse
    .flat()
    .sort((a, b) => (a.due ?? Infinity) - (b.due ?? Infinity))
    .slice(0, 30);
}

/* ------------------------------------------------------------------ */
/* Gmail (inbox metadata only: sender, subject, snippet)               */
/* ------------------------------------------------------------------ */

export type MailItem = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: number;
  unread: boolean;
  link: string;
};

type RawMsg = {
  id: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: { headers?: { name: string; value: string }[] };
};

export async function fetchInbox(): Promise<MailItem[]> {
  const base = "https://gmail.googleapis.com/gmail/v1/users/me";
  const list = await gfetch<{ messages?: { id: string }[] }>(
    "gmail",
    `${base}/messages?maxResults=15&labelIds=INBOX`
  );
  const msgs = await Promise.all(
    (list.messages ?? []).map((m) =>
      gfetch<RawMsg>(
        "gmail",
        `${base}/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`
      )
    )
  );
  const email = googleEmail();
  return msgs.map((m) => {
    const h = (n: string) => m.payload?.headers?.find((x) => x.name.toLowerCase() === n)?.value ?? "";
    const rawFrom = h("from");
    const from = rawFrom.replace(/<.*>/, "").replace(/"/g, "").trim() || rawFrom;
    return {
      id: m.id,
      from: from || "Unknown sender",
      subject: h("subject") || "(No subject)",
      snippet: m.snippet ?? "",
      date: Number(m.internalDate ?? 0),
      unread: (m.labelIds ?? []).includes("UNREAD"),
      link: `https://mail.google.com/mail/${email ? `?authuser=${encodeURIComponent(email)}` : "u/0/"}#inbox/${m.id}`,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Drive (recent files, metadata only)                                 */
/* ------------------------------------------------------------------ */

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modified: number;
  link?: string;
};

type RawFile = { id: string; name: string; mimeType: string; modifiedTime: string; webViewLink?: string };

export async function fetchDriveFiles(): Promise<DriveFile[]> {
  const qs = new URLSearchParams({
    orderBy: "modifiedTime desc",
    pageSize: "25",
    q: "trashed = false",
    fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
  });
  const data = await gfetch<{ files?: RawFile[] }>(
    "drive",
    `https://www.googleapis.com/drive/v3/files?${qs}`
  );
  return (data.files ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modified: new Date(f.modifiedTime).getTime(),
    link: f.webViewLink,
  }));
}
