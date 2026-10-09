const COLORS: [number, string][] = [[85, "#10b981"], [70, "#14b8a6"], [50, "#8b5cf6"], [30, "#f59e0b"], [0, "#f43f5e"]];
export const scoreColor = (score: number) => (COLORS.find(([min]) => score >= min) ?? COLORS[COLORS.length - 1])[1];

/** Circular gauge. The ring animates only when the score changes, and not at all if the user prefers reduced motion. */
export default function ScoreRing({ score, label, size = 96 }: { score: number; label: string; size?: number }) {
  const stroke = Math.max(6, Math.round(size / 12));
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Life score ${score} out of 100, ${label}`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200 dark:stroke-white/10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" stroke={scoreColor(score)}
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-semibold tabular-nums" style={{ fontSize: size * 0.34 }}>{score}</span>
        <span className="mt-0.5 text-slate-500 dark:text-slate-400" style={{ fontSize: Math.max(10, size * 0.11) }}>of 100</span>
      </div>
    </div>
  );
}
