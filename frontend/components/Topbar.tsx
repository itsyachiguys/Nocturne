import { IconSearch, IconBell } from "@tabler/icons-react";

interface TopbarProps {
  studentName: string;
  quote: string;
}

// Formats today's date once, server-side, so every dashboard route
// that mounts this bar shows a consistent, correctly localized date.
function formatToday(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function Topbar({ studentName, quote }: TopbarProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-[22px]">Good evening, {studentName}</h2>
        <p className="text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
          {formatToday()} · &ldquo;{quote}&rdquo;
        </p>
      </div>
      <div className="flex items-center gap-3.5">
        <div className="flex w-56 items-center gap-2 rounded-full bg-surface-alt px-4 py-2.5 text-[13px] text-ink-muted dark:bg-surface-alt-dark dark:text-ink-muted-dark">
          <IconSearch size={16} />
          Quick search...
        </div>
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt text-ink-secondary dark:bg-surface-alt-dark dark:text-ink-secondary-dark"
        >
          <IconBell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-coral" />
        </button>
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky to-soft-purple" />
      </div>
    </div>
  );
}
