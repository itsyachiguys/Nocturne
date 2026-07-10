import type { Icon } from "@tabler/icons-react";

interface FeatureCardProps {
  icon: Icon;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  description: string;
}

// Single-purpose presentational card used across the landing page
// feature grid. Kept dumb on purpose — all copy and icon choices
// live in the page-level data array, not hardcoded here.
export function FeatureCard({
  icon: IconComponent,
  iconBgClass,
  iconColorClass,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="card p-6 transition-shadow hover:shadow-floating">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md ${iconBgClass} ${iconColorClass}`}
      >
        <IconComponent size={20} stroke={1.75} />
      </div>
      <h4 className="mb-1 text-[15px] font-semibold">{title}</h4>
      <p className="text-[13px] leading-relaxed text-ink-secondary dark:text-ink-secondary-dark">
        {description}
      </p>
    </div>
  );
}
