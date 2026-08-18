"use client";

import type { Flashcard } from "@/types/flashcard";

import FlashcardCard from "./FlashcardCard";

interface FlashcardListProps {
  cards: Flashcard[];
}

export default function FlashcardList({
  cards,
}: FlashcardListProps) {
  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <h3 className="text-lg font-medium">
          No flashcards yet
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Add your first flashcard to this deck.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card, index) => (
        <FlashcardCard
          key={card.id}
          card={card}
          index={index}
        />
      ))}
    </div>
  );
}