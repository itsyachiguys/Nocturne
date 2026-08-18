"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FlashcardService } from "@/services/flashcard.service";
import { auth } from "@/lib/firebase";

interface FlashcardDeck {
  id: string;
  title: string;
  description?: string;
  studentId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export default function FlashcardsPage() {
  const router = useRouter();

  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");

  const loadDecks = async () => {
    const user = auth.currentUser;

    if (!user?.uid) {
      setDecks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await FlashcardService.getDecks(user.uid);

      setDecks(result as FlashcardDeck[]);
    } catch (err) {
      console.error("Failed to load flashcard decks:", err);
      setError("Failed to load decks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleCreateDeck = async () => {
    const user = auth.currentUser;

    if (!user?.uid) {
      setError("You must be logged in to create a deck.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a deck title.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      await FlashcardService.createDeck({
        studentId: user.uid,
        title: title.trim(),
        description: description.trim(),
      });

      setTitle("");
      setDescription("");
      setShowModal(false);

      await loadDecks();
    } catch (err) {
      console.error("Failed to create flashcard deck:", err);
      setError("Failed to create deck.");
    } finally {
      setCreating(false);
    }
  };

  const handleCloseModal = () => {
    if (creating) return;

    setShowModal(false);
    setTitle("");
    setDescription("");
    setError("");
  };

  const handleOpenDeck = (deckId: string) => {
    router.push(`/dashboard/flashcards/${deckId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Flashcards</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create and study flashcard decks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Generate deck
        </button>
      </div>

      {error && !showModal && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading decks...
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">
            No flashcard decks yet
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Create your first deck to start studying.
          </p>

          <button
            type="button"
            onClick={() => {
              setError("");
              setShowModal(true);
            }}
            className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Generate deck
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <button
              key={deck.id}
              type="button"
              onClick={() => handleOpenDeck(deck.id)}
              className="rounded-xl border p-5 text-left transition hover:bg-muted/50"
            >
              <h2 className="font-semibold">
                {deck.title}
              </h2>

              {deck.description && (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {deck.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Create deck
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Give your flashcard deck a title and description.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="deck-title"
                  className="mb-2 block text-sm font-medium"
                >
                  Deck title
                </label>

                <input
                  id="deck-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures"
                  disabled={creating}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="deck-description"
                  className="mb-2 block text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="deck-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this deck about?"
                  rows={4}
                  disabled={creating}
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={creating}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateDeck}
                disabled={creating || !title.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create deck"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}