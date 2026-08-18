"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconCards,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { FlashcardService } from "@/services/flashcard.service";
import { auth } from "@/lib/firebase";
import {
  Flashcard,
  FlashcardDeck,
  FlashcardDifficulty,
} from "@/types/flashcard";

export default function FlashcardDeckPage() {
  const params = useParams();
  const router = useRouter();

  const deckId = params.deckId as string;

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [showAddCard, setShowAddCard] = useState(false);
  const [savingCard, setSavingCard] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] =
    useState<FlashcardDifficulty>("new");

  useEffect(() => {
    let cancelled = false;

    async function loadDeck() {
      try {
        const user = auth.currentUser;

        if (!user) {
          router.push("/login");
          return;
        }

        const [deckData, cardData] = await Promise.all([
          FlashcardService.getDeck(deckId),
          FlashcardService.getCards(deckId),
        ]);

        if (cancelled) return;

        setDeck(deckData);
        setCards(cardData);
      } catch (error) {
        console.error(
          "Failed to load flashcard deck:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (deckId) {
      loadDeck();
    }

    return () => {
      cancelled = true;
    };
  }, [deckId, router]);

  function resetCardForm() {
    setQuestion("");
    setAnswer("");
    setHint("");
    setTags("");
    setDifficulty("new");
  }

  function closeAddCard() {
    if (savingCard) return;

    setShowAddCard(false);
    resetCardForm();
  }

  async function handleAddCard(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    if (!question.trim()) {
      alert("Please enter a question.");
      return;
    }

    if (!answer.trim()) {
      alert("Please enter an answer.");
      return;
    }

    setSavingCard(true);

    try {
      const parsedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const cardId = await FlashcardService.createCard({
        deckId,
        studentId: user.uid,
        question: question.trim(),
        answer: answer.trim(),
        hint: hint.trim() || undefined,
        tags:
          parsedTags.length > 0
            ? parsedTags
            : undefined,
        difficulty,
      });

      const newCard =
        await FlashcardService.getCard(cardId);

      if (newCard) {
        setCards((current) => [
          ...current,
          newCard,
        ]);
      }

      setDeck((current) =>
        current
          ? {
              ...current,
              cardCount: current.cardCount + 1,
            }
          : current
      );

      closeAddCard();
    } catch (error) {
      console.error(
        "Failed to create flashcard:",
        error
      );

      alert("Failed to create flashcard.");
    } finally {
      setSavingCard(false);
    }
  }

  async function handleDeleteCard(cardId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this flashcard?"
    );

    if (!confirmed) return;

    try {
      await FlashcardService.deleteCard(
        cardId,
        deckId
      );

      setCards((current) =>
        current.filter(
          (card) => card.id !== cardId
        )
      );

      setDeck((current) =>
        current
          ? {
              ...current,
              cardCount: Math.max(
                0,
                current.cardCount - 1
              ),
            }
          : current
      );
    } catch (error) {
      console.error(
        "Failed to delete flashcard:",
        error
      );

      alert("Failed to delete flashcard.");
    }
  }

  async function handleDeleteDeck() {
    if (!deck) return;

    const confirmed = window.confirm(
      `Delete "${deck.title}"?\n\nThis will permanently delete the deck and all of its flashcards.`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await FlashcardService.deleteDeck(deck.id);

      router.push("/dashboard/flashcards");
    } catch (error) {
      console.error(
        "Failed to delete flashcard deck:",
        error
      );

      alert("Failed to delete flashcard deck.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
          Loading flashcard deck...
        </p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender/10 text-lavender-dark">
          <IconCards size={28} />
        </div>

        <h2 className="text-lg font-semibold text-ink-primary dark:text-ink-primary-dark">
          Deck not found
        </h2>

        <p className="mt-2 text-sm text-ink-secondary dark:text-ink-secondary-dark">
          This flashcard deck does not exist or is no
          longer available.
        </p>

        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/flashcards")
          }
          className="mt-6 rounded-xl bg-lavender px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Back to Flashcards
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="card p-6 md:p-8">
        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/flashcards")
          }
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-secondary transition hover:text-lavender-dark dark:text-ink-secondary-dark"
        >
          <IconArrowLeft size={18} />
          Back to Flashcards
        </button>

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender/10 text-lavender-dark">
              <IconCards size={28} />
            </div>

            <h1 className="text-3xl font-bold text-ink-primary dark:text-ink-primary-dark">
              {deck.title}
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-ink-secondary dark:text-ink-secondary-dark">
              {deck.description || "No description"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-ink-secondary dark:bg-surface-alt-dark dark:text-ink-secondary-dark">
                {cards.length}{" "}
                {cards.length === 1
                  ? "card"
                  : "cards"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAddCard(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-lavender px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <IconPlus size={18} />
              Add Card
            </button>

            <button
              type="button"
              onClick={handleDeleteDeck}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/30 dark:hover:bg-red-500/10"
            >
              <IconTrash size={18} />
              {deleting
                ? "Deleting..."
                : "Delete Deck"}
            </button>
          </div>
        </div>
      </div>

      {/* ADD CARD FORM */}

      {showAddCard && (
        <div className="card p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink-primary dark:text-ink-primary-dark">
                Add Flashcard
              </h2>

              <p className="mt-1 text-sm text-ink-secondary dark:text-ink-secondary-dark">
                Create a question and answer for this
                deck.
              </p>
            </div>

            <button
              type="button"
              onClick={closeAddCard}
              disabled={savingCard}
              className="rounded-lg p-2 text-ink-secondary transition hover:bg-surface-alt dark:text-ink-secondary-dark dark:hover:bg-surface-alt-dark"
              aria-label="Close"
            >
              <IconX size={20} />
            </button>
          </div>

          <form
            onSubmit={handleAddCard}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="question"
                className="mb-2 block text-sm font-medium text-ink-primary dark:text-ink-primary-dark"
              >
                Question
              </label>

              <textarea
                id="question"
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                placeholder="e.g. What is polymorphism in Java?"
                rows={4}
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-ink-primary outline-none transition focus:border-lavender focus:ring-2 focus:ring-lavender/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="answer"
                className="mb-2 block text-sm font-medium text-ink-primary dark:text-ink-primary-dark"
              >
                Answer
              </label>

              <textarea
                id="answer"
                value={answer}
                onChange={(event) =>
                  setAnswer(event.target.value)
                }
                placeholder="Write the answer..."
                rows={5}
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-ink-primary outline-none transition focus:border-lavender focus:ring-2 focus:ring-lavender/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="hint"
                className="mb-2 block text-sm font-medium text-ink-primary dark:text-ink-primary-dark"
              >
                Hint
                <span className="ml-1 text-xs font-normal text-ink-secondary">
                  (optional)
                </span>
              </label>

              <textarea
                id="hint"
                value={hint}
                onChange={(event) =>
                  setHint(event.target.value)
                }
                placeholder="Give yourself a small clue..."
                rows={3}
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-ink-primary outline-none transition focus:border-lavender focus:ring-2 focus:ring-lavender/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="tags"
                  className="mb-2 block text-sm font-medium text-ink-primary dark:text-ink-primary-dark"
                >
                  Tags
                  <span className="ml-1 text-xs font-normal text-ink-secondary">
                    (optional)
                  </span>
                </label>

                <input
                  id="tags"
                  value={tags}
                  onChange={(event) =>
                    setTags(event.target.value)
                  }
                  placeholder="java, oops, inheritance"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-ink-primary outline-none transition focus:border-lavender focus:ring-2 focus:ring-lavender/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />

                <p className="mt-1.5 text-xs text-ink-secondary dark:text-ink-secondary-dark">
                  Separate tags with commas.
                </p>
              </div>

              <div>
                <label
                  htmlFor="difficulty"
                  className="mb-2 block text-sm font-medium text-ink-primary dark:text-ink-primary-dark"
                >
                  Difficulty
                </label>

                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(
                      event.target
                        .value as FlashcardDifficulty
                    )
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-ink-primary outline-none transition focus:border-lavender focus:ring-2 focus:ring-lavender/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="new">New</option>
                  <option value="again">Again</option>
                  <option value="hard">Hard</option>
                  <option value="good">Good</option>
                  <option value="easy">Easy</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-700">
              <button
                type="button"
                onClick={closeAddCard}
                disabled={savingCard}
                className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-ink-secondary transition hover:bg-surface-alt disabled:opacity-50 dark:border-zinc-700 dark:text-ink-secondary-dark dark:hover:bg-surface-alt-dark"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingCard}
                className="rounded-xl bg-lavender px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingCard
                  ? "Saving..."
                  : "Save Flashcard"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FLASHCARDS */}

      {cards.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-lavender/10 text-lavender-dark">
            <IconCards size={32} />
          </div>

          <h2 className="text-lg font-semibold text-ink-primary dark:text-ink-primary-dark">
            No flashcards yet
          </h2>

          <p className="mt-2 max-w-md text-sm text-ink-secondary dark:text-ink-secondary-dark">
            This deck is empty. Add your first flashcard
            to start studying.
          </p>

          <button
            type="button"
            onClick={() => setShowAddCard(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-lavender px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <IconPlus size={18} />
            Add First Card
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="card p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender/10 text-sm font-semibold text-lavender-dark">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
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
                      <>
                        <p className="mt-5 text-xs font-medium uppercase tracking-wide text-ink-secondary dark:text-ink-secondary-dark">
                          Hint
                        </p>

                        <p className="mt-2 text-sm text-ink-secondary dark:text-ink-secondary-dark">
                          {card.hint}
                        </p>
                      </>
                    )}

                    {card.tags &&
                      card.tags.length > 0 && (
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
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteCard(card.id)
                  }
                  className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                  title="Delete card"
                  aria-label="Delete card"
                >
                  <IconTrash size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}