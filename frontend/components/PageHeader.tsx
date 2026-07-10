import type { Icon } from "@tabler/icons-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: Icon;
}

// Every dashboard subpage opens with the same title + subtitle + single
// primary action shape, so the pattern lives here once rather than being
// retyped with slightly different spacing on each page.
export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon: ActionIcon,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-[22px]">{title}</h2>
        {subtitle && (
          <p className="text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
            {subtitle}
          </p>
        )}
      </div>
      {actionLabel && (
        <button className="btn-primary">
          {ActionIcon && <ActionIcon size={16} />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
