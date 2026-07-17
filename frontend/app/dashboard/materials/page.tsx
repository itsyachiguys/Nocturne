import { IconUpload, IconFileText, IconPresentation, IconNotebook } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { STUDY_FILES } from "@/lib/ai-workspace-data";

const TYPE_ICON = {
  pdf: IconFileText,
  slides: IconPresentation,
  notes: IconNotebook,
} as const;

export default function MaterialsPage() {
  return (
    <>
      <PageHeader
        title="Study Materials"
        subtitle={`${STUDY_FILES.length} files uploaded`}
        actionLabel="Upload PDF"
        actionIcon={IconUpload}
      />

      <div className="card divide-y divide-line dark:divide-line-dark overflow-hidden">
        {STUDY_FILES.map((file) => {
          const Icon = TYPE_ICON[file.type] || IconFileText;
          return (
            <div 
              key={file.id} 
              className="flex items-center gap-5 p-5 hover:bg-surface-alt dark:hover:bg-surface-alt-dark transition-colors group"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-lavender/10 text-lavender-dark">
                <Icon size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink-primary truncate group-hover:text-lavender-dark transition-colors">
                  {file.name}
                </p>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                  {file.subject} • {file.size} • Uploaded {file.uploaded}
                </p>
              </div>

              <button className="btn-ghost px-5 py-2.5 text-xs font-medium whitespace-nowrap">
                Generate Notes
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}