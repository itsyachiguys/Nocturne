import { IconMoonStars } from "@tabler/icons-react";

const STATS: [string, string][] = [
  ["40k+", "students onboard"],
  ["2.1M", "notes generated"],
  ["4.9/5", "average rating"],
];

// Shared branded panel for the login/signup split layout. Kept as its
// own component so both auth pages stay pixel-identical without
// copy-pasting the gradient + copy block. Hidden below md — auth forms
// are full-width on mobile.
export function AuthPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-brand-gradient px-12 py-14 text-white md:flex md:w-[44%] md:flex-col md:justify-between">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex items-center gap-2 font-display text-xl font-extrabold">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15">
          <IconMoonStars size={18} />
        </div>
        Nocturne
      </div>

      <div className="relative max-w-sm">
        <h2 className="mb-4 text-[32px] leading-tight text-white">
          Run your entire academic life from one calm workspace.
        </h2>
        <p className="text-[15px] leading-relaxed text-white/80">
          Notes, quizzes, attendance and deadlines — organized by AI, so
          study time stays for studying.
        </p>
      </div>

      <div className="relative flex gap-8">
        {STATS.map(([num, label]) => (
          <div key={label}>
            <p className="font-display text-xl font-extrabold text-white">{num}</p>
            <p className="text-xs text-white/70">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
