import { IconPin, IconNotes, IconSearch, IconPlus } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { NOTES } from "@/lib/ai-workspace-data";

export default function NotesPage() {
  const pinned = NOTES.filter((n) => n.pinned);
  const rest = NOTES.filter((n) => !n.pinned);

  return (
    <>
      <PageHeader 
        title="Notes" 
        subtitle={`${NOTES.length} notes across all subjects`} 
        actionLabel="New note" 
        actionIcon={IconPlus} 
      />

      {/* Search Bar */}
      <div className="mb-8 flex w-full max-w-md items-center gap-3 rounded-2xl bg-surface-alt px-5 py-3 text-sm text-ink-muted dark:bg-surface-alt-dark dark:text-ink-muted-dark">
        <IconSearch size={18} />
        <input 
          type="text" 
          placeholder="Search notes..." 
          className="flex-1 bg-transparent outline-none" 
        />
      </div>

      {/* Pinned Notes */}
      {pinned.length > 0 && (
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <IconPin size={16} className="text-pastel-orange" />
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark">Pinned</p>
          </div>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((note) => (
              <div key={note.id} className="card p-6 group hover:shadow-soft transition-all">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lavender/10 text-lavender-dark">
                    <IconNotes size={20} />
                  </div>
                  <IconPin size={18} className="text-pastel-orange" />
                </div>
                
                <p className="line-clamp-2 text-[15px] font-semibold text-ink-primary group-hover:text-lavender-dark transition-colors">
                  {note.title}
                </p>
                
                <p className="mt-3 text-xs text-ink-secondary dark:text-ink-secondary-dark">
                  {note.subject} • Updated {note.updated}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Notes */}
      <div>
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-ink-muted dark:text-ink-muted-dark">Recent</p>
        
        <div className="card divide-y divide-line dark:divide-line-dark">
          {rest.map((note) => (
            <div key={note.id} className="flex items-center gap-5 p-5 hover:bg-surface-alt dark:hover:bg-surface-alt-dark transition-colors">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-lavender/10 text-lavender-dark">
                <IconNotes size={20} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-ink-primary">{note.title}</p>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{note.subject}</p>
              </div>
              
              <span className="text-xs text-ink-muted whitespace-nowrap dark:text-ink-muted-dark">
                {note.updated}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}