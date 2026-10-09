"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import {
  IconApps,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconBook2,
  IconBrandGithub,
  IconBrandGoogleDrive,
  IconBrandYoutube,
  IconCalendar,
  IconCheck,
  IconCloud,
  IconExternalLink,
  IconFileText,
  IconForms,
  IconInfoCircle,
  IconMail,
  IconNotebook,
  IconPencil,
  IconPlus,
  IconPresentation,
  IconRefresh,
  IconSchool,
  IconSearch,
  IconTable,
  IconTrash,
  IconUsers,
  IconVideo,
  IconWorld,
  IconX,
  IconAppWindow,
  IconAtom,
  IconBooks,
  IconBrush,
  IconCalculator,
  IconCode,
  IconClock
} from "@tabler/icons-react";

import {
  CATEGORIES,
  PRESETS,
  STARTER_PACK,
  addAcademicApp,
  addAcademicApps,
  colorFor,
  deleteAcademicApp,
  knownToBlockFraming,
  normalizeUrl,
  subscribeAcademicApps,
  toEmbedUrl,
  updateAcademicApp,
  type AcademicApp,
  type AppCategory,
  type AppEmbed,
  type AppInput,
  type Preset,
} from "@/lib/academics";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const CARD = "card dark:bg-gradient-to-b dark:from-white/[0.05] dark:to-transparent";
const MAX_OPEN_TABS = 6;
const SANDBOX =
  "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-presentation";

const ICONS: Record<string, typeof IconWorld> = {
  classroom: IconSchool,
  gmail: IconMail,
  outlook: IconMail,
  docs: IconFileText,
  sheets: IconTable,
  slides: IconPresentation,
  drive: IconBrandGoogleDrive,
  onedrive: IconCloud,
  calendar: IconCalendar,
  meet: IconVideo,
  zoom: IconVideo,
  forms: IconForms,
  teams: IconUsers,
  notion: IconNotebook,
  github: IconBrandGithub,
  youtube: IconBrandYoutube,
  moodle: IconBook2,
  calculator: IconCalculator,
  atom: IconAtom,
  draw: IconBrush,
  code: IconCode,
  timer: IconClock,
  book: IconBooks,
  link: IconWorld,
};

const iconFor = (key: string) => ICONS[key] ?? IconWorld;

function toInput(p: Preset): AppInput {
  return {
    name: p.name,
    url: p.url,
    icon: p.icon,
    color: p.color,
    category: p.category,
    embed: p.embed,
  };
}

/** True when the site is expected to load inside the Nocturne panel. */
function canInline(app: AcademicApp) {
  return !knownToBlockFraming(app.url);
}

function openNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function AppIcon({
  app,
  size = 18,
  box = "h-9 w-9",
}: {
  app: Pick<AcademicApp, "icon" | "color">;
  size?: number;
  box?: string;
}) {
  const Icon = iconFor(app.icon);
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl ${box}`}
      style={{ background: `${app.color}22`, color: app.color }}
    >
      <Icon size={size} stroke={1.8} />
    </span>
  );
}

/** A single row in the app list. */
const AppRow = memo(function AppRow({
  app,
  active,
  open,
  onOpen,
  onEdit,
  onDelete,
}: {
  app: AcademicApp;
  active: boolean;
  open: boolean;
  onOpen: (a: AcademicApp) => void;
  onEdit: (a: AcademicApp) => void;
  onDelete: (a: AcademicApp) => void;
}) {
  return (
    <div
      className={`group relative flex items-center gap-3 rounded-2xl border px-2.5 py-2 transition-all duration-200 ${
        active
          ? "border-lavender-dark/40 bg-lavender/10"
          : "border-transparent hover:bg-surface-alt/70 dark:hover:bg-white/5"
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(app)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-lavender-dark/50 rounded-xl"
      >
        <AppIcon app={app} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">{app.name}</span>
          <span className="block text-[10.5px] text-ink-muted dark:text-ink-muted-dark">
            {canInline(app) ? "Opens inside Nocturne" : "Site blocks embedding"}
          </span>
        </span>
        {open && (
          <span
            title="Open in a tab"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-lavender-dark"
          />
        )}
      </button>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label={`Edit ${app.name}`}
          onClick={() => onEdit(app)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt dark:text-ink-muted-dark dark:hover:bg-white/10"
        >
          <IconPencil size={14} />
        </button>
        <button
          type="button"
          aria-label={`Remove ${app.name}`}
          onClick={() => onDelete(app)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-coral/10 hover:text-coral dark:text-ink-muted-dark"
        >
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  );
});

/** Shown instead of an iframe for sites that are known to refuse being framed. */
function LaunchCard({ app, onTryHere }: { app: AcademicApp; onTryHere: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <AppIcon app={app} size={34} box="h-20 w-20" />
      <div>
        <h3 className="text-lg font-bold">{app.name}</h3>
        <p className="mx-auto mt-1.5 max-w-md text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
          {app.name} tells browsers not to show it inside other websites. That is a security
          setting on their side, so it will probably appear blank or say &quot;refused to
          connect&quot; here. You can still try.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={onTryHere}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-[13px] font-semibold text-white shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
        >
          <IconAppWindow size={16} />
          Try opening here
        </button>
        <button
          type="button"
          onClick={() => openNewTab(app.url)}
          className="inline-flex items-center gap-2 rounded-xl bg-surface-alt px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-surface-alt/70 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <IconExternalLink size={16} />
          Open in new tab
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add / edit dialog                                                   */
/* ------------------------------------------------------------------ */

type DialogState = { mode: "add" } | { mode: "edit"; app: AcademicApp };

function AppDialog({
  state,
  existingUrls,
  onClose,
  onAddPresets,
  onSaveCustom,
}: {
  state: DialogState;
  existingUrls: Set<string>;
  onClose: () => void;
  onAddPresets: (presets: Preset[]) => Promise<void>;
  onSaveCustom: (input: AppInput, id?: string) => Promise<void>;
}) {
  const editing = state.mode === "edit" ? state.app : null;
  const [tab, setTab] = useState<"popular" | "custom">(editing ? "custom" : "popular");
  const [name, setName] = useState(editing?.name ?? "");
  const [url, setUrl] = useState(editing?.url ?? "");
  const [category, setCategory] = useState<AppCategory>(editing?.category ?? "Learning");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (tab === "custom") nameRef.current?.focus();
  }, [tab]);

  const normalized = normalizeUrl(url);
  const converted = normalized ? toEmbedUrl(normalized) !== normalized : false;
  const blocked = normalized ? knownToBlockFraming(normalized) : false;

  async function submitCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Give the app a name.");
    if (!normalized) return setError("Enter a valid link, for example https://moodle.youruni.edu");
    setError("");
    setBusy(true);
    try {
      const embed: AppEmbed = "iframe";
      // Firestore applies the write locally at once but only resolves after the
      // server confirms. Don't leave the dialog stuck if the server is slow or
      // unreachable: report real errors, otherwise close after a short wait.
      const save = onSaveCustom(
        {
          name: name.trim(),
          url: normalized,
          icon: editing?.icon ?? "link",
          color: editing?.color ?? colorFor(name.trim()),
          category,
          embed,
        },
        editing?.id
      );
      save.catch((err) => console.error("save academic app (late)", err));
      await Promise.race([save, new Promise<void>((resolve) => setTimeout(resolve, 3000))]);
      onClose();
    } catch (err) {
      console.error("save academic app", err);
      setError("Could not save. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit app" : "Add an app"}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-surface-card shadow-soft dark:border-line-dark dark:bg-[#1c1730]"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4 dark:border-line-dark">
          <div>
            <h3 className="text-base font-bold">{editing ? "Edit app" : "Add an app"}</h3>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
              Tools your university uses, all in one place.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt dark:text-ink-muted-dark dark:hover:bg-white/10"
          >
            <IconX size={18} />
          </button>
        </div>

        {!editing && (
          <div className="flex gap-1 px-6 pt-4">
            {(["popular", "custom"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  tab === t
                    ? "bg-lavender-dark text-white"
                    : "bg-surface-alt text-ink-secondary hover:bg-surface-alt/70 dark:bg-white/10 dark:text-ink-secondary-dark"
                }`}
              >
                {t === "popular" ? "Popular apps" : "Custom link"}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto px-6 py-4">
          {tab === "popular" && !editing ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PRESETS.map((p) => {
                const added = existingUrls.has(p.url);
                const Icon = iconFor(p.icon);
                return (
                  <button
                    key={p.name}
                    type="button"
                    disabled={added || adding === p.name}
                    onClick={async () => {
                      setAdding(p.name);
                      try {
                        await onAddPresets([p]);
                      } finally {
                        setAdding(null);
                      }
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-line px-3 py-2.5 text-left transition-colors hover:bg-surface-alt/70 disabled:opacity-60 dark:border-line-dark dark:hover:bg-white/5"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${p.color}22`, color: p.color }}
                    >
                      <Icon size={18} stroke={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                      <span className="block truncate text-[11px] text-ink-muted dark:text-ink-muted-dark">
                        {p.blurb}
                      </span>
                    </span>
                    {added ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-mint">
                        <IconCheck size={14} /> Added
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lavender/10 text-lavender-dark">
                        <IconPlus size={15} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={submitCustom} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Name</label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. University Moodle"
                  className="w-full rounded-xl border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus:border-lavender-dark dark:border-line-dark"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Link</label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://… or paste a Google Doc / Drive / Forms share link"
                  className="w-full rounded-xl border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus:border-lavender-dark dark:border-line-dark"
                />
                {converted && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-mint">
                    <IconCheck size={13} /> This link can be shown inside Nocturne.
                  </p>
                )}
                {blocked && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] text-pastel-orange">
                    <IconInfoCircle size={13} className="mt-px shrink-0" />
                    This site usually blocks being shown inside other sites, so it may appear blank
                    in Nocturne. You can still add it and open it in a new tab.
                  </p>
                )}
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AppCategory)}
                    className="w-full rounded-xl border border-line bg-transparent px-3 py-2.5 text-sm outline-none focus:border-lavender-dark dark:border-line-dark dark:bg-[#1c1730]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {error && <p className="text-xs font-semibold text-coral">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2.5 text-[13px] font-semibold text-ink-secondary hover:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-brand-gradient px-5 py-2.5 text-[13px] font-semibold text-white shadow-soft disabled:opacity-60"
                >
                  {busy ? "Saving…" : editing ? "Save changes" : "Add app"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AcademicsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [apps, setApps] = useState<AcademicApp[] | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | AppCategory>("All");

  const [openIds, setOpenIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reloadKeys, setReloadKeys] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [forced, setForced] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [tipHidden, setTipHidden] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (u) => setUid(u?.uid ?? null));
  }, []);

  useEffect(() => {
    try {
      setTipHidden(localStorage.getItem("nocturne.academics.tipHidden") === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    if (!uid) return;
    return subscribeAcademicApps(
      uid,
      setApps,
      (e) => {
        console.error("academic apps", e);
        setApps([]);
      }
    );
  }, [uid]);

  // Drop tabs whose app was deleted.
  useEffect(() => {
    if (!apps) return;
    const ids = new Set(apps.map((a) => a.id));
    setOpenIds((o) => {
      const next = o.filter((id) => ids.has(id));
      return next.length === o.length ? o : next;
    });
    setActiveId((a) => (a && !ids.has(a) ? null : a));
  }, [apps]);

  // Esc leaves expanded mode.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded]);

  const byId = useMemo(() => new Map((apps ?? []).map((a) => [a.id, a])), [apps]);
  const existingUrls = useMemo(() => new Set((apps ?? []).map((a) => a.url)), [apps]);
  const activeApp = activeId ? byId.get(activeId) ?? null : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (apps ?? []).filter(
      (a) =>
        (category === "All" || a.category === category) &&
        (!q || a.name.toLowerCase().includes(q) || a.url.toLowerCase().includes(q))
    );
  }, [apps, search, category]);

  const grouped = useMemo(() => {
    const map = new Map<AppCategory, AcademicApp[]>();
    for (const c of CATEGORIES) map.set(c, []);
    filtered.forEach((a) => map.get(a.category)!.push(a));
    return [...map.entries()].filter(([, list]) => list.length > 0);
  }, [filtered]);

  const openApp = useCallback((app: AcademicApp) => {
    setActiveId(app.id);
    setOpenIds((ids) => (ids.includes(app.id) ? ids : [...ids, app.id].slice(-MAX_OPEN_TABS)));
  }, []);

  function closeTab(id: string) {
    const next = openIds.filter((i) => i !== id);
    setOpenIds(next);
    if (activeId === id) setActiveId(next[next.length - 1] ?? null);
  }

  const reload = (id: string) => {
    setLoaded((l) => ({ ...l, [id]: false }));
    setReloadKeys((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }));
  };

  const handleDelete = useCallback(
    async (app: AcademicApp) => {
      if (!uid) return;
      if (!window.confirm(`Remove ${app.name} from Academics?`)) return;
      try {
        await deleteAcademicApp(uid, app.id);
      } catch (e) {
        console.error("delete academic app", e);
      }
    },
    [uid]
  );

  const handleEdit = useCallback((app: AcademicApp) => setDialog({ mode: "edit", app }), []);

  async function addPresets(presets: Preset[]) {
    if (!uid) return;
    await addAcademicApps(uid, presets.map(toInput));
  }

  async function saveCustom(input: AppInput, id?: string) {
    if (!uid) throw new Error("not signed in");
    if (id) await updateAcademicApp(uid, id, input);
    else await addAcademicApp(uid, input);
  }

  async function addStarterPack() {
    if (!uid || seeding) return;
    setSeeding(true);
    try {
      await addPresets(PRESETS.filter((p) => STARTER_PACK.includes(p.name)));
    } catch (e) {
      console.error("starter pack", e);
    } finally {
      setSeeding(false);
    }
  }

  const hasApps = !!apps && apps.length > 0;

  /* ---------------- Viewer ---------------- */

  const viewer = (
    <div
      className={`${CARD} flex min-h-0 flex-col overflow-hidden p-0 ${
        expanded ? "fixed inset-3 z-[70] shadow-soft" : "h-[calc(100vh-250px)] min-h-[520px]"
      }`}
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-line px-2 py-1.5 dark:border-line-dark">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {openIds.map((id) => {
            const app = byId.get(id);
            if (!app) return null;
            const isActive = id === activeId;
            const Icon = iconFor(app.icon);
            return (
              <div
                key={id}
                className={`group flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  isActive
                    ? "bg-lavender/15 text-ink-primary dark:text-ink-primary-dark"
                    : "text-ink-secondary hover:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-white/5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(id)}
                  className="flex items-center gap-2"
                >
                  <span style={{ color: app.color }}>
                    <Icon size={15} stroke={1.9} />
                  </span>
                  <span className="max-w-[140px] truncate">{app.name}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Close ${app.name}`}
                  onClick={() => closeTab(id)}
                  className="flex h-4 w-4 items-center justify-center rounded text-ink-muted opacity-60 hover:bg-black/10 hover:opacity-100 dark:text-ink-muted-dark dark:hover:bg-white/15"
                >
                  <IconX size={12} />
                </button>
              </div>
            );
          })}
          {openIds.length === 0 && (
            <span className="px-3 py-1.5 text-xs text-ink-muted dark:text-ink-muted-dark">
              No tabs open
            </span>
          )}
        </div>

        {activeApp && (
          <div className="flex shrink-0 items-center gap-0.5 pl-1">
            {(canInline(activeApp) || forced[activeApp.id]) && (
              <button
                type="button"
                title="Reload"
                onClick={() => reload(activeApp.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-white/10"
              >
                <IconRefresh size={16} />
              </button>
            )}
            <button
              type="button"
              title="Open in new tab"
              onClick={() => openNewTab(activeApp.url)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-white/10"
            >
              <IconExternalLink size={16} />
            </button>
            <button
              type="button"
              title={expanded ? "Exit full view (Esc)" : "Full view"}
              onClick={() => setExpanded((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-white/10"
            >
              {expanded ? <IconArrowsMinimize size={16} /> : <IconArrowsMaximize size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative min-h-0 flex-1">
        {!activeApp && (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-lavender/10 text-lavender-dark">
              <IconApps size={30} />
            </span>
            <h3 className="text-base font-bold">Pick an app to open it here</h3>
            <p className="max-w-md text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
              Apps open in this panel, right inside Nocturne. Links to specific Google Docs, Sheets,
              Slides, Forms and Drive files work best. Sites that block embedding (like Gmail and
              Classroom) can be opened in a new tab instead.
            </p>
          </div>
        )}

        {/* Keep embedded apps mounted so their state survives tab switching. */}
        {openIds.map((id) => {
          const app = byId.get(id);
          if (!app) return null;
          const isActive = id === activeId;

          if (!canInline(app) && !forced[id]) {
            return isActive ? (
              <div key={id} className="absolute inset-0">
                <LaunchCard
                  app={app}
                  onTryHere={() => setForced((f) => ({ ...f, [id]: true }))}
                />
              </div>
            ) : null;
          }

          return (
            <div
              key={`${id}-${reloadKeys[id] ?? 0}`}
              className={`absolute inset-0 ${isActive ? "" : "hidden"}`}
            >
              {!loaded[id] && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-card dark:bg-[#1c1730]">
                  <div className="flex items-center gap-3 text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-lavender-dark border-t-transparent" />
                    Loading {app.name}…
                  </div>
                </div>
              )}
              <iframe
                title={app.name}
                src={toEmbedUrl(app.url)}
                sandbox={SANDBOX}
                allow="fullscreen; clipboard-write; autoplay"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setLoaded((l) => ({ ...l, [id]: true }))}
                className="h-full w-full border-0 bg-white"
              />
              {isActive && (
                <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => openNewTab(app.url)}
                    className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-ink-primary/90 px-3.5 py-1.5 text-[11.5px] font-semibold text-white shadow-soft backdrop-blur dark:bg-white/90 dark:text-[#1b1630]"
                  >
                    <IconInfoCircle size={13} />
                    Blank or refused to connect? Open in a new tab
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ---------------- Render ---------------- */

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">Academics</h1>
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
            Every tool your university uses, one click away.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ mode: "add" })}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-[13px] font-semibold text-white shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
        >
          <IconPlus size={16} />
          Add app
        </button>
      </div>

      {/* One-time explanation */}
      {!tipHidden && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-lavender-dark/30 bg-lavender/10 p-4 text-[12.5px]">
          <IconInfoCircle size={18} className="mt-0.5 shrink-0 text-lavender-dark" />
          <p className="flex-1 text-ink-secondary dark:text-ink-secondary-dark">
            <span className="font-semibold text-ink-primary dark:text-ink-primary-dark">
              How opening works:{" "}
            </span>
            Apps open in the panel below, right inside Nocturne. Paste a link to a specific Google
            Doc, Sheet, Slide, Form or Drive file (Add app, then Custom link) and it loads fully.
            Big sites like Gmail, Classroom and Meet forbid being embedded, so they may show
            blank here; use the new-tab button for those.
          </p>
          <button
            type="button"
            aria-label="Hide tip"
            onClick={() => {
              setTipHidden(true);
              try {
                localStorage.setItem("nocturne.academics.tipHidden", "1");
              } catch {
                /* ignore */
              }
            }}
            className="text-ink-muted hover:text-ink-primary dark:text-ink-muted-dark"
          >
            <IconX size={16} />
          </button>
        </div>
      )}

      {/* Empty state: first visit */}
      {apps !== null && !hasApps ? (
        <div className={`${CARD} mx-auto flex max-w-2xl flex-col items-center gap-4 p-10 text-center`}>
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-gradient text-white shadow-soft">
            <IconApps size={30} />
          </span>
          <h3 className="text-lg font-bold">Build your academic hub</h3>
          <p className="max-w-md text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
            Add the tools you use every day and open them without leaving Nocturne. Start with the
            essentials or pick your own.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={addStarterPack}
              disabled={seeding || !uid}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-[13px] font-semibold text-white shadow-soft disabled:opacity-60"
            >
              <IconSchool size={16} />
              {seeding ? "Adding…" : "Add the starter pack"}
            </button>
            <button
              type="button"
              onClick={() => setDialog({ mode: "add" })}
              className="rounded-xl bg-surface-alt px-5 py-2.5 text-[13px] font-semibold dark:bg-white/10"
            >
              Choose apps myself
            </button>
          </div>
          <p className="text-[11.5px] text-ink-muted dark:text-ink-muted-dark">
            Starter pack: Classroom, Gmail, Docs, Drive, Calendar, Meet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
          {/* App list */}
          <aside className={`${CARD} flex h-fit flex-col gap-3 p-4 lg:max-h-[calc(100vh-250px)]`}>
            <div className="relative">
              <IconSearch
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search apps"
                className="w-full rounded-xl border border-line bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-lavender-dark dark:border-line-dark"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(["All", ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    category === c
                      ? "bg-lavender-dark text-white"
                      : "bg-surface-alt text-ink-secondary hover:bg-surface-alt/70 dark:bg-white/10 dark:text-ink-secondary-dark"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {apps === null ? (
                [0, 1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-12 animate-pulse rounded-2xl bg-surface-alt dark:bg-white/5"
                  />
                ))
              ) : grouped.length === 0 ? (
                <p className="py-4 text-center text-[12.5px] text-ink-muted dark:text-ink-muted-dark">
                  No apps match your search.
                </p>
              ) : (
                grouped.map(([cat, list]) => (
                  <div key={cat}>
                    <p className="mb-1 px-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-muted dark:text-ink-muted-dark">
                      {cat}
                    </p>
                    <div className="space-y-0.5">
                      {list.map((app) => (
                        <AppRow
                          key={app.id}
                          app={app}
                          active={app.id === activeId}
                          open={openIds.includes(app.id)}
                          onOpen={openApp}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Viewer */}
          {viewer}
        </div>
      )}

      {dialog && (
        <AppDialog
          state={dialog}
          existingUrls={existingUrls}
          onClose={() => setDialog(null)}
          onAddPresets={addPresets}
          onSaveCustom={saveCustom}
        />
      )}
    </>
  );
}