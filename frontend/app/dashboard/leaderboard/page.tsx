import { IconTrophy } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { LEADERBOARD } from "@/lib/dashboard-data";

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader title="Leaderboard" subtitle="Ranked by weekly study points" />
      <div className="card divide-y divide-line dark:divide-line-dark">
        {LEADERBOARD.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center gap-3 p-4 ${entry.isCurrentUser ? "bg-lavender/5" : ""}`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-sm font-bold dark:bg-surface-alt-dark">
              {entry.rank <= 3 ? <IconTrophy size={16} className="text-pastel-orange" /> : entry.rank}
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-mint to-sky" />
            <p className={`flex-1 text-sm ${entry.isCurrentUser ? "font-semibold" : ""}`}>{entry.name}</p>
            <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">{entry.points}</p>
          </div>
        ))}
      </div>
    </>
  );
}
