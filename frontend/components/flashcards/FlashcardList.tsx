"use client";

import type { Flashcard } from "@/types/flashcard";
import FlashcardCard from "./FlashcardCard";

interface FlashcardListProps {
  cards: Flashcard[];
  onDelete?: (cardId: string) => void;
}

export default function FlashcardList({
  cards,
  onDelete,
}: FlashcardListProps) {
  return (
    <div className="space-y-4">
      {cards.map((card, index) => (
        <FlashcardCard
          key={card.id}
          card={card}
          index={index}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}