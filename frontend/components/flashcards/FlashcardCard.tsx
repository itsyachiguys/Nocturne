"use client";

import type { Flashcard } from "@/types/flashcard";

interface FlashcardCardProps {
  card: Flashcard;
  index: number;
}

export default function FlashcardCard({
  card,
  index,
}: FlashcardCardProps) {
  return (
    <div className="rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Card {index + 1}
        </span>

        <span className="rounded-full bg-muted px-2.5 py-1 text-xs capitalize">
          {card.difficulty}
        </span>
      </div>

      <div>
        <p className="text-sm font-medium">
          Question
        </p>

        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
          {card.question}
        </p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium">
          Answer
        </p>

        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
          {card.answer}
        </p>
      </div>

      {card.hint && (
        <div className="mt-5 rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium">
            Hint
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {card.hint}
          </p>
        </div>
      )}

      {card.tags && card.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex gap-4 border-t pt-4 text-xs text-muted-foreground">
        <span>
          Correct: {card.correctCount}
        </span>

        <span>
          Incorrect: {card.incorrectCount}
        </span>
      </div>
    </div>
  );
}