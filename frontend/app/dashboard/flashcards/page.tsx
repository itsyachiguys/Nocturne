import { IconCards, IconPlus } from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { FLASHCARD_DECKS } from "@/lib/ai-workspace-data";

function masteryColor(mastery: number) {
  if (mastery >= 75) return "bg-mint";
  if (mastery >= 50) return "bg-pastel-orange";
  return "bg-coral";
}

export default function FlashcardsPage() {
  return (
    <>
      <PageHeader
        title="Flashcards"
        subtitle={`${FLASHCARD_DECKS.length} decks generated from your notes`}
        actionLabel="Generate deck"
        actionIcon={IconPlus}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FLASHCARD_DECKS.map((deck) => (
          <div key={deck.id} className="card p-5 transition-shadow hover:shadow-soft">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-sm bg-lavender/10 text-lavender-dark">
              <IconCards size={18} />
            </div>
            <h4 className="mb-1 text-[14.5px]">{deck.title}</h4>
            <p className="mb-4 text-xs text-ink-secondary dark:text-ink-secondary-dark">
              {deck.subject} · {deck.cardCount} cards
            </p>
            <div className="mb-1 flex items-center justify-between text-xs text-ink-secondary dark:text-ink-secondary-dark">
              <span>Mastery</span>
              <span>{deck.mastery}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark">
              <div className={`h-1.5 rounded-full ${masteryColor(deck.mastery)}`} style={{ width: `${deck.mastery}%` }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
