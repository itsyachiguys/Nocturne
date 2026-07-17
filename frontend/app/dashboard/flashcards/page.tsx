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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FLASHCARD_DECKS.map((deck) => (
          <div 
            key={deck.id} 
            className="card p-6 group hover:shadow-soft hover:-translate-y-0.5 transition-all"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender/10 text-lavender-dark">
              <IconCards size={26} />
            </div>

            <h4 className="mb-2 text-[15px] font-semibold text-ink-primary group-hover:text-lavender-dark transition-colors">
              {deck.title}
            </h4>

            <p className="mb-6 text-sm text-ink-secondary dark:text-ink-secondary-dark">
              {deck.subject} • {deck.cardCount} cards
            </p>

            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-ink-secondary dark:text-ink-secondary-dark">Mastery</span>
              <span className="font-medium text-lavender-dark">{deck.mastery}%</span>
            </div>

            <div className="h-2 w-full rounded-full bg-surface-alt dark:bg-surface-alt-dark overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all ${masteryColor(deck.mastery)}`}
                style={{ width: `${deck.mastery}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}