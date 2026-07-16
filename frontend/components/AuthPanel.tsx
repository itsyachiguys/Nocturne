import Image from "next/image";

const STATS: [string, string][] = [
  ["40k+", "students onboard"],
  ["2.1M", "notes generated"],
  ["4.9/5", "average rating"],
];

// Shared branded panel for Login & Signup pages
export function AuthPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-brand-gradient px-12 py-14 text-white md:flex md:w-[44%] md:flex-col md:justify-between">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      {/* Logo + Brand */}
      <div className="relative flex items-center gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-white shadow-lg">
          <Image
            src="/Logo.png"
            alt="Nocturne Logo"
            width={48}
            height={48}
            priority
            className="h-full w-full object-cover"
          />
        </div>

        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
          Nocturne
        </h1>
      </div>

      {/* Hero Content */}
      <div className="relative max-w-sm">
        <h2 className="mb-4 text-[32px] font-bold leading-tight text-white">
          Run your entire academic life from one calm workspace.
        </h2>

        <p className="text-[15px] leading-relaxed text-white/80">
          Notes, quizzes, attendance, AI-generated summaries, personalized
          study plans, deadlines, flashcards, and academic insights — all
          organized intelligently so your focus stays on learning instead of
          managing everything manually.
        </p>
      </div>

      {/* Statistics */}
      <div className="relative flex gap-8">
        {STATS.map(([num, label]) => (
          <div key={label}>
            <p className="font-display text-2xl font-extrabold text-white">
              {num}
            </p>
            <p className="text-xs uppercase tracking-wide text-white/70">
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}