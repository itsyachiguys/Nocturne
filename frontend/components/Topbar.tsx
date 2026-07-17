import { IconSearch, IconBell } from "@tabler/icons-react";
import Image from "next/image";

interface TopbarProps {
  studentName: string;
  quote: string;
}

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
      {/* Left Side */}
      <div>
        <h2 className="text-[22px] font-bold">
          Good evening, {studentName}
        </h2>

        <p className="text-[13px] text-ink-secondary dark:text-ink-secondary-dark">
          {formatToday()} · &ldquo;{quote}&rdquo;
        </p>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">

        {/* Search */}
        <div className="flex w-60 items-center gap-2 rounded-full bg-surface-alt px-4 py-2.5 text-[13px] text-ink-muted dark:bg-surface-alt-dark dark:text-ink-muted-dark">
          <IconSearch size={16} />
          <span>Quick search...</span>
        </div>

        {/* Notification */}
        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-ink-secondary transition hover:scale-105 dark:bg-surface-alt-dark dark:text-ink-secondary-dark"
        >
          <IconBell size={18} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral" />
        </button>

        {/* User Logo */}
        <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-lavender shadow-md">
          <Image
            src="/Logo.png"
            alt="Nocturne Logo"
            fill
            className="object-cover"
            priority
          />
        </div>

      </div>
    </div>
  );
}