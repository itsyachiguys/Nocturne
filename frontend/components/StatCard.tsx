import type { Icon } from "@tabler/icons-react";

interface StatCardProps {
  icon: Icon;
  iconBgClass: string;
  iconColorClass: string;
  value: string;
  label: string;
  delta?: string;
  deltaTone?: "positive" | "negative";
}

// Displays a single dashboard metric (CGPA, attendance, streak, etc).
// `deltaTone` drives color only — copy/formatting stays the caller's job
// so this component never guesses at business logic like thresholds.
export function StatCard({
  icon: IconComponent,
  iconBgClass,
  iconColorClass,
  value,
  label,
  delta,
  deltaTone = "positive",
}: StatCardProps) {
  const deltaColorClass =
    deltaTone === "positive" ? "text-mint" : "text-coral";

  return (
    <div className="card p-4">
      <div
        className={`mb-3 flex h-8 w-8 items-center justify-center rounded-sm ${iconBgClass} ${iconColorClass}`}
      >
        <IconComponent size={16} stroke={1.75} />
      </div>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="mt-0.5 text-xs text-ink-secondary dark:text-ink-secondary-dark">
        {label}
      </p>
      {delta && (
        <p className={`mt-1.5 text-[11px] font-semibold ${deltaColorClass}`}>
          {delta}
        </p>
      )}
    </div>
  );
}
