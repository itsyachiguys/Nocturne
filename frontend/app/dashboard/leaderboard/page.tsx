import { IconTrophy } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { LEADERBOARD } from "@/lib/dashboard-data";

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader 
        title="Leaderboard" 
        subtitle="Ranked by weekly study points" 
      />

      <div className="card divide-y divide-line dark:divide-line-dark overflow-hidden">
        {LEADERBOARD.map((entry, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-5 p-5 transition-all hover:bg-surface-alt dark:hover:bg-surface-alt-dark ${
              entry.isCurrentUser ? "bg-lavender/10" : ""
            }`}
          >
            {/* Rank */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-surface-alt font-mono text-lg font-bold dark:bg-surface-alt-dark">
              {entry.rank <= 3 ? (
                <IconTrophy size={22} className="text-pastel-orange" />
              ) : (
                entry.rank
              )}
            </div>

            {/* Avatar */}
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-mint to-sky flex-shrink-0" />

            {/* Name & Info */}
            <div className="flex-1">
              <p className={`text-[15px] ${entry.isCurrentUser ? "font-semibold text-lavender-dark" : "font-medium"}`}>
                {entry.name}
              </p>
              {entry.isCurrentUser && (
                <p className="text-xs text-lavender">You are here</p>
              )}
            </div>

            {/* Points */}
            <div className="text-right">
              <p className="text-xl font-semibold text-ink-primary">{entry.points}</p>
              <p className="text-[10px] uppercase tracking-widest text-ink-secondary">pts</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}