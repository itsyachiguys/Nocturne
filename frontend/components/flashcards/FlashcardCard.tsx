"use client";

import { IconTrash } from "@tabler/icons-react";
import type { Flashcard } from "@/types/flashcard";

interface FlashcardCardProps {
  card: Flashcard;
  index: number;
  onDelete?: (cardId: string) => void;
}

export default function FlashcardCard({
  card,
  index,
  onDelete,
}: FlashcardCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender/10 text-sm font-semibold text-lavender-dark">
            {index + 1}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-secondary dark:text-ink-secondary-dark">
              Question
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-ink-primary dark:text-ink-primary-dark">
              {card.question}
            </p>

            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-ink-secondary dark:text-ink-secondary-dark">
              Answer
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-secondary dark:text-ink-secondary-dark">
              {card.answer}
            </p>

            {card.hint && (
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-secondary dark:text-ink-secondary-dark">
                  Hint
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-secondary dark:text-ink-secondary-dark">
                  {card.hint}
                </p>
              </div>
            )}

            {card.tags && card.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-surface-alt px-2.5 py-1 text-xs text-ink-secondary dark:bg-surface-alt-dark dark:text-ink-secondary-dark"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-4 text-xs text-ink-secondary dark:text-ink-secondary-dark">
              <span>
                Difficulty:{" "}
                <span className="capitalize">
                  {card.difficulty}
                </span>
              </span>

              <span>
                Correct: {card.correctCount}
              </span>

              <span>
                Incorrect: {card.incorrectCount}
              </span>
            </div>
          </div>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
            title="Delete card"
            aria-label="Delete card"
          >
            <IconTrash size={18} />
          </button>
        )}
      </div>
    </div>
  );
}