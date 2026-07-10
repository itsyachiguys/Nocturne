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
        title="Study material"
        subtitle={`${STUDY_FILES.length} files uploaded`}
        actionLabel="Upload PDF"
        actionIcon={IconUpload}
      />
      <div className="card divide-y divide-line dark:divide-line-dark">
        {STUDY_FILES.map((file) => {
          const Icon = TYPE_ICON[file.type];
          return (
            <div key={file.id} className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-lavender/10 text-lavender-dark">
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">
                  {file.subject} · {file.size} · uploaded {file.uploaded}
                </p>
              </div>
              <button className="btn-ghost px-4 py-2 text-xs">Generate notes</button>
            </div>
          );
        })}
      </div>
    </>
  );
}
