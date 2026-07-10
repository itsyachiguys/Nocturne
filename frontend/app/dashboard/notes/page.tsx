import { IconPin, IconNotes, IconSearch, IconPlus } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { NOTES } from "@/lib/ai-workspace-data";

export default function NotesPage() {
  const pinned = NOTES.filter((n) => n.pinned);
  const rest = NOTES.filter((n) => !n.pinned);

  return (
    <>
      <PageHeader title="Notes" subtitle={`${NOTES.length} notes across all subjects`} actionLabel="New note" actionIcon={IconPlus} />

      <div className="mb-5 flex w-full max-w-sm items-center gap-2 rounded-full bg-surface-alt px-4 py-2.5 text-[13px] text-ink-muted dark:bg-surface-alt-dark dark:text-ink-muted-dark">
        <IconSearch size={16} /> Search notes...
      </div>

      {pinned.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
            Pinned
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((note) => (
              <div key={note.id} className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-lavender/10 text-lavender-dark">
                    <IconNotes size={16} />
                  </div>
                  <IconPin size={14} className="text-pastel-orange" />
                </div>
                <p className="text-sm font-semibold">{note.title}</p>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                  {note.subject} · updated {note.updated}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
        Recent
      </p>
      <div className="card divide-y divide-line dark:divide-line-dark">
        {rest.map((note) => (
          <div key={note.id} className="flex items-center gap-4 p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-lavender/10 text-lavender-dark">
              <IconNotes size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{note.title}</p>
              <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{note.subject}</p>
            </div>
            <span className="text-xs text-ink-muted dark:text-ink-muted-dark">{note.updated}</span>
          </div>
        ))}
      </div>
    </>
  );
}
