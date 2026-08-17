import type { Icon } from "@tabler/icons-react";

interface EmptyStateProps {
  icon: Icon;
  title: string;
  description: string;
  actionLabel?: string;
}

// Used whenever a collection (notes, quizzes, planner tasks, etc.) is
// empty. Per the brief, every page needs a designed empty state rather
// than a bare blank area.
export function EmptyState({
  icon: IconComponent,
  title,
  description,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-3 px-8 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-alt text-lavender-dark dark:bg-surface-alt-dark">
        <IconComponent size={26} stroke={1.5} />
      </div>
      <h4 className="text-[15px]">{title}</h4>
      <p className="max-w-xs text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
        {description}
      </p>
      {actionLabel && <button className="btn-primary mt-2">{actionLabel}</button>}
    </div>
  );
}
