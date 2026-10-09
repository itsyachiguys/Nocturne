import type { Decision } from "@/lib/obliqo/types";

// Shared Nocturne-themed class strings for the Obliqo section.
export const FIELD =
  "w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark";
export const LABEL =
  "text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark";
export const MUTED = "text-sm text-ink-secondary dark:text-ink-secondary-dark";
export const H4 =
  "text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark";

export const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-colors ${
    active
      ? "border-transparent bg-brand-gradient text-white"
      : "border-line text-ink-secondary hover:border-lavender dark:border-line-dark dark:text-ink-secondary-dark"
  }`;

export const DECISION_STYLE: Record<Decision, string> = {
  apply: "bg-mint/10 text-mint",
  wait: "bg-pastel-orange/10 text-pastel-orange",
  skip: "bg-sky/10 text-sky",
  avoid: "bg-coral/10 text-coral",
};

export const scoreColor = (score: number) =>
  score >= 70 ? "text-mint" : score >= 50 ? "text-pastel-orange" : "text-coral";
