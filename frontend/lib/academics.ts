import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // same path as quizzes.ts / planner.ts

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export const CATEGORIES = [
  "Learning",
  "Mail & Calendar",
  "Docs & Files",
  "Meetings",
  "Study Tools",
  "Math & Science",
  "Coding",
  "Reference",
  "Other",
] as const;
export type AppCategory = (typeof CATEGORIES)[number];

/**
 * iframe   = shown inside Nocturne (works only if the site allows being framed)
 * external = opened in a pop-up window / new tab (for sites that block framing)
 * NOTE: the page currently decides this with knownToBlockFraming(), not this field.
 */
export type AppEmbed = "iframe" | "external";

export type AcademicApp = {
  id: string;
  name: string;
  url: string;
  icon: string; // preset key ("gmail", "classroom", ...) or "link"
  color: string; // hex, used for the icon chip
  category: AppCategory;
  embed: AppEmbed;
  createdAt: Date | null;
};

export type AppInput = Omit<AcademicApp, "id" | "createdAt">;

export type Preset = AppInput & { blurb: string };

/* ------------------------------------------------------------------ */
/* Popular tools                                                       */
/* Icon keys must exist in ICONS in the page file.                     */
/* ------------------------------------------------------------------ */

export const PRESETS: Preset[] = [
  /* ---- University / big providers (these refuse to be framed) ---- */
  { name: "Google Classroom", url: "https://classroom.google.com", icon: "classroom", color: "#0f9d58", category: "Learning", embed: "external", blurb: "Classes, assignments, grades" },
  { name: "Gmail", url: "https://mail.google.com", icon: "gmail", color: "#ea4335", category: "Mail & Calendar", embed: "external", blurb: "University email" },
  { name: "Google Calendar", url: "https://calendar.google.com", icon: "calendar", color: "#4285f4", category: "Mail & Calendar", embed: "external", blurb: "Schedule and deadlines" },
  { name: "Google Docs", url: "https://docs.google.com/document/u/0/", icon: "docs", color: "#4285f4", category: "Docs & Files", embed: "external", blurb: "Documents and assignments" },
  { name: "Google Sheets", url: "https://docs.google.com/spreadsheets/u/0/", icon: "sheets", color: "#0f9d58", category: "Docs & Files", embed: "external", blurb: "Spreadsheets" },
  { name: "Google Slides", url: "https://docs.google.com/presentation/u/0/", icon: "slides", color: "#f4b400", category: "Docs & Files", embed: "external", blurb: "Presentations" },
  { name: "Google Drive", url: "https://drive.google.com", icon: "drive", color: "#34a853", category: "Docs & Files", embed: "external", blurb: "Files and folders" },
  { name: "Google Forms", url: "https://docs.google.com/forms/u/0/", icon: "forms", color: "#7248b9", category: "Docs & Files", embed: "external", blurb: "Surveys and quizzes" },
  { name: "Google Meet", url: "https://meet.google.com", icon: "meet", color: "#00897b", category: "Meetings", embed: "external", blurb: "Online lectures" },
  { name: "Microsoft Teams", url: "https://teams.microsoft.com", icon: "teams", color: "#5b5fc7", category: "Meetings", embed: "external", blurb: "Classes and chats" },
  { name: "Outlook", url: "https://outlook.office.com", icon: "outlook", color: "#0078d4", category: "Mail & Calendar", embed: "external", blurb: "Microsoft email" },
  { name: "OneDrive", url: "https://onedrive.live.com", icon: "onedrive", color: "#0364b8", category: "Docs & Files", embed: "external", blurb: "Microsoft files" },
  { name: "Zoom", url: "https://zoom.us", icon: "zoom", color: "#2d8cff", category: "Meetings", embed: "external", blurb: "Video meetings" },
  { name: "Notion", url: "https://www.notion.so", icon: "notion", color: "#6b7280", category: "Other", embed: "external", blurb: "Notes and wikis" },
  { name: "GitHub", url: "https://github.com", icon: "github", color: "#6e5494", category: "Other", embed: "external", blurb: "Code and projects" },

  /* ---- Sites that normally allow being shown inside Nocturne ----
     Not guaranteed: sites can change their headers at any time.
     If one shows blank, use the new-tab button, or add its host to
     BLOCKED_HOSTS below so it shows the launch card instead. */

  // Study tools
  { name: "Excalidraw", url: "https://excalidraw.com", icon: "draw", color: "#6965db", category: "Study Tools", embed: "iframe", blurb: "Whiteboard and diagrams" },
  { name: "tldraw", url: "https://www.tldraw.com", icon: "draw", color: "#2f80ed", category: "Study Tools", embed: "iframe", blurb: "Infinite whiteboard" },
  { name: "diagrams.net", url: "https://app.diagrams.net", icon: "draw", color: "#f08705", category: "Study Tools", embed: "iframe", blurb: "Flowcharts and diagrams" },
  { name: "Mermaid Live", url: "https://mermaid.live", icon: "draw", color: "#ff3670", category: "Study Tools", embed: "iframe", blurb: "Diagrams from text" },
  { name: "Pomofocus", url: "https://pomofocus.io", icon: "timer", color: "#e03131", category: "Study Tools", embed: "iframe", blurb: "Pomodoro study timer" },
  { name: "Monkeytype", url: "https://monkeytype.com", icon: "timer", color: "#e2b714", category: "Study Tools", embed: "iframe", blurb: "Typing practice" },

  // Math & Science
  { name: "Desmos Graphing", url: "https://www.desmos.com/calculator", icon: "calculator", color: "#2f9e44", category: "Math & Science", embed: "iframe", blurb: "Graphing calculator" },
  { name: "Desmos Scientific", url: "https://www.desmos.com/scientific", icon: "calculator", color: "#37b24d", category: "Math & Science", embed: "iframe", blurb: "Scientific calculator" },
  { name: "Desmos Geometry", url: "https://www.desmos.com/geometry", icon: "calculator", color: "#20c997", category: "Math & Science", embed: "iframe", blurb: "Constructions and geometry" },
  { name: "GeoGebra", url: "https://www.geogebra.org/classic", icon: "calculator", color: "#6557d2", category: "Math & Science", embed: "iframe", blurb: "Geometry, algebra and graphs" },
  { name: "PhET Simulations", url: "https://phet.colorado.edu/en/simulations/browse", icon: "atom", color: "#f59f00", category: "Math & Science", embed: "iframe", blurb: "Physics, chemistry, maths sims" },
  { name: "Periodic Table", url: "https://ptable.com", icon: "atom", color: "#7048e8", category: "Math & Science", embed: "iframe", blurb: "Interactive periodic table" },
  { name: "Math Is Fun", url: "https://www.mathsisfun.com", icon: "calculator", color: "#1c7ed6", category: "Math & Science", embed: "iframe", blurb: "Maths explained simply" },
  { name: "Paul's Online Math Notes", url: "https://tutorial.math.lamar.edu", icon: "book", color: "#c92a2a", category: "Math & Science", embed: "iframe", blurb: "Algebra, calculus, diff. equations" },
  { name: "3Blue1Brown", url: "https://www.3blue1brown.com", icon: "atom", color: "#1971c2", category: "Math & Science", embed: "iframe", blurb: "Visual maths lessons" },
  { name: "LibreTexts", url: "https://libretexts.org", icon: "book", color: "#0c8599", category: "Math & Science", embed: "iframe", blurb: "Free open textbooks" },

  // Coding
  { name: "W3Schools", url: "https://www.w3schools.com", icon: "code", color: "#04aa6d", category: "Coding", embed: "iframe", blurb: "Web and programming tutorials" },
  { name: "MDN Web Docs", url: "https://developer.mozilla.org", icon: "code", color: "#1971c2", category: "Coding", embed: "iframe", blurb: "HTML, CSS, JS reference" },
  { name: "DevDocs", url: "https://devdocs.io", icon: "code", color: "#4c6ef5", category: "Coding", embed: "iframe", blurb: "Fast API documentation" },
  { name: "VisuAlgo", url: "https://visualgo.net", icon: "code", color: "#e8590c", category: "Coding", embed: "iframe", blurb: "Algorithm visualisations" },
  { name: "Algorithm Visualizer", url: "https://algorithm-visualizer.org", icon: "code", color: "#0ca678", category: "Coding", embed: "iframe", blurb: "Interactive algorithms" },
  { name: "Python Tutor", url: "https://pythontutor.com", icon: "code", color: "#3572a5", category: "Coding", embed: "iframe", blurb: "Step through code execution" },
  { name: "Learn Git Branching", url: "https://learngitbranching.js.org", icon: "github", color: "#f05133", category: "Coding", embed: "iframe", blurb: "Interactive Git practice" },
  { name: "Regex101", url: "https://regex101.com", icon: "code", color: "#5c940d", category: "Coding", embed: "iframe", blurb: "Test regular expressions" },
  { name: "Big-O Cheat Sheet", url: "https://www.bigocheatsheet.com", icon: "code", color: "#d6336c", category: "Coding", embed: "iframe", blurb: "Complexity quick reference" },
  { name: "Flexbox Froggy", url: "https://flexboxfroggy.com", icon: "code", color: "#74b816", category: "Coding", embed: "iframe", blurb: "Learn CSS flexbox" },
  { name: "Blockly Games", url: "https://blockly.games", icon: "code", color: "#f59f00", category: "Coding", embed: "iframe", blurb: "Learn programming by playing" },
  { name: "Scratch", url: "https://scratch.mit.edu", icon: "code", color: "#ff9f1a", category: "Coding", embed: "iframe", blurb: "Visual block coding" },

  // Learning
  { name: "MIT OpenCourseWare", url: "https://ocw.mit.edu", icon: "classroom", color: "#a31f34", category: "Learning", embed: "iframe", blurb: "Free MIT course materials" },
  { name: "OpenStax", url: "https://openstax.org", icon: "book", color: "#0dc0dc", category: "Learning", embed: "iframe", blurb: "Free college textbooks" },
  { name: "Wikibooks", url: "https://en.wikibooks.org", icon: "book", color: "#339af0", category: "Learning", embed: "iframe", blurb: "Open-content textbooks" },

  // Reference
  { name: "Wikipedia", url: "https://en.wikipedia.org", icon: "book", color: "#495057", category: "Reference", embed: "iframe", blurb: "Quick topic lookups" },
  { name: "Wiktionary", url: "https://en.wiktionary.org", icon: "book", color: "#868e96", category: "Reference", embed: "iframe", blurb: "Free dictionary" },
  { name: "arXiv", url: "https://arxiv.org", icon: "book", color: "#b31b1b", category: "Reference", embed: "iframe", blurb: "Research papers" },
  { name: "Semantic Scholar", url: "https://www.semanticscholar.org", icon: "book", color: "#1857b6", category: "Reference", embed: "iframe", blurb: "AI-powered paper search" },
  { name: "DOAJ", url: "https://doaj.org", icon: "book", color: "#e67700", category: "Reference", embed: "iframe", blurb: "Open-access journals" },
  { name: "Project Gutenberg", url: "https://www.gutenberg.org", icon: "book", color: "#5c7cfa", category: "Reference", embed: "iframe", blurb: "Free books and texts" },
  { name: "Open Library", url: "https://openlibrary.org", icon: "book", color: "#6741d9", category: "Reference", embed: "iframe", blurb: "Borrow and read books" },
  { name: "Internet Archive", url: "https://archive.org", icon: "book", color: "#343a40", category: "Reference", embed: "iframe", blurb: "Books, papers, media" },
];

// The six most students want on day one.
export const STARTER_PACK = [
  "Google Classroom",
  "Gmail",
  "Google Docs",
  "Google Drive",
  "Google Calendar",
  "Google Meet",
];

/* ------------------------------------------------------------------ */
/* URL helpers                                                         */
/* ------------------------------------------------------------------ */

/** Adds https:// when missing; returns null for anything that is not http(s). */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Turns a normal share link into the embeddable version when one exists
 * (Docs/Sheets/Slides preview, Forms embedded, Drive file/folder, YouTube).
 */
export function toEmbedUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const host = u.hostname;
    const path = u.pathname;

    if (host === "docs.google.com") {
      const m = path.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
      if (m) return `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
      if (path.startsWith("/forms/") && path.includes("/viewform")) {
        u.searchParams.set("embedded", "true");
        return u.toString();
      }
    }
    if (host === "drive.google.com") {
      const f = path.match(/^\/file\/d\/([^/]+)/);
      if (f) return `https://drive.google.com/file/d/${f[1]}/preview`;
      const d = path.match(/\/folders\/([^/?]+)/);
      if (d) return `https://drive.google.com/embeddedfolderview?id=${d[1]}#list`;
    }
    if (host.endsWith("youtube.com") && path === "/watch") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (host === "youtu.be" && path.length > 1) {
      return `https://www.youtube.com/embed/${path.slice(1)}`;
    }
    return raw;
  } catch {
    return raw;
  }
}

/** Hosts that refuse to be shown inside another website. Add more here if a site shows blank. */
const BLOCKED_HOSTS = [
  // Google
  "mail.google.com",
  "classroom.google.com",
  "meet.google.com",
  "accounts.google.com",
  "calendar.google.com",
  "scholar.google.com",
  // Microsoft / video
  "teams.microsoft.com",
  "outlook.office.com",
  "outlook.live.com",
  "onedrive.live.com",
  "zoom.us",
  // Productivity / code
  "notion.so",
  "github.com",
  "replit.com",
  "overleaf.com",
  "stackoverflow.com",
  // Learning platforms
  "instructure.com", // Canvas
  "quizlet.com",
  "chegg.com",
  "coursera.org",
  "udemy.com",
  "wolframalpha.com",
  // AI chat
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  // Social
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "reddit.com",
];

/** Sites that are known to refuse being shown inside another website. */
export function knownToBlockFraming(url: string): boolean {
  try {
    const u = new URL(url);
    if (toEmbedUrl(url) !== url) return false; // we can convert it
    if (u.hostname === "calendar.google.com" && u.pathname.startsWith("/calendar/embed")) {
      return false;
    }
    if (u.hostname === "docs.google.com" || u.hostname === "drive.google.com") return true;
    return BLOCKED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

const PALETTE = ["#8b7be0", "#5cc8f0", "#f58a7c", "#f5b66c", "#6fd8b0", "#e879a9", "#7aa2f7"];
export function colorFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/* ------------------------------------------------------------------ */
/* Firestore: users/{uid}/academicApps/{id}                            */
/* Covered by the existing users/{uid}/{document=**} rule.             */
/* ------------------------------------------------------------------ */

const SNAP = { serverTimestamps: "estimate" } as const;

function toDate(v: unknown): Date | null {
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate();
  }
  return v instanceof Date ? v : null;
}

const appsCol = (uid: string) => collection(db, "users", uid, "academicApps");
const appDoc = (uid: string, id: string) => doc(db, "users", uid, "academicApps", id);

function mapApp(id: string, d: Record<string, unknown>): AcademicApp {
  const cat = d.category as AppCategory;
  return {
    id,
    name: (d.name as string) ?? "",
    url: (d.url as string) ?? "",
    icon: (d.icon as string) ?? "link",
    color: (d.color as string) ?? "#8b7be0",
    category: (CATEGORIES as readonly string[]).includes(cat) ? cat : "Other",
    embed: d.embed === "iframe" ? "iframe" : "external",
    createdAt: toDate(d.createdAt),
  };
}

export function subscribeAcademicApps(
  uid: string,
  cb: (apps: AcademicApp[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  const q = query(appsCol(uid), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => mapApp(d.id, d.data(SNAP)))),
    onError
  );
}

export async function addAcademicApp(uid: string, input: AppInput) {
  await addDoc(appsCol(uid), { ...input, createdAt: serverTimestamp() });
}

export async function addAcademicApps(uid: string, inputs: AppInput[]) {
  const batch = writeBatch(db);
  inputs.forEach((input) =>
    batch.set(doc(appsCol(uid)), { ...input, createdAt: serverTimestamp() })
  );
  await batch.commit();
}

export async function updateAcademicApp(uid: string, id: string, input: AppInput) {
  await updateDoc(appDoc(uid, id), { ...input });
}

export async function deleteAcademicApp(uid: string, id: string) {
  await deleteDoc(appDoc(uid, id));
}