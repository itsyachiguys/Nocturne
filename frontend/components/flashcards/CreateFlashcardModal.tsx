"use client";

import { useEffect, useState, type FormEvent } from "react";

import type {
  CreateFlashcardData,
  FlashcardDifficulty,
} from "@/types/flashcard";

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateFlashcardData) => Promise<void> | void;
  deckId: string;
  studentId: string;
}

const DIFFICULTIES: {
  value: FlashcardDifficulty;
  label: string;
}[] = [
  { value: "new", label: "New" },
  { value: "easy", label: "Easy" },
  { value: "good", label: "Good" },
  { value: "hard", label: "Hard" },
  { value: "again", label: "Again" },
];

export default function CreateFlashcardModal({
  isOpen,
  onClose,
  onCreate,
  deckId,
  studentId,
}: CreateFlashcardModalProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] =
    useState<FlashcardDifficulty>("new");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuestion("");
      setAnswer("");
      setHint("");
      setTags("");
      setDifficulty("new");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Prevent background page scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Allow Escape to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    if (!answer.trim()) {
      setError("Please enter an answer.");
      return;
    }

    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const data: CreateFlashcardData = {
      deckId,
      studentId,
      question: question.trim(),
      answer: answer.trim(),
      difficulty,
      ...(hint.trim() ? { hint: hint.trim() } : {}),
      ...(parsedTags.length > 0
        ? { tags: parsedTags }
        : {}),
    };

    try {
      setIsSubmitting(true);

      await onCreate(data);

      onClose();
    } catch (err) {
      console.error("Failed to create flashcard:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create flashcard. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSubmitting
        ) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-flashcard-title"
    >
      {/* ================================
          MODAL
      ================================= */}
      <div
        className="
          flex
          w-full
          max-w-xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-gray-200
          bg-white
          shadow-2xl
        "
        style={{
          maxHeight: "calc(100vh - 32px)",
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {/* ================================
            HEADER
        ================================= */}
        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-gray-200
            bg-white
            px-6
            py-5
          "
        >
          <div>
            <h2
              id="create-flashcard-title"
              className="
                text-xl
                font-semibold
                tracking-tight
                text-gray-900
              "
            >
              Create Flashcard
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add a new card to your deck.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-xl
              leading-none
              text-gray-500
              transition
              hover:bg-gray-100
              hover:text-gray-900
              disabled:pointer-events-none
              disabled:opacity-50
            "
          >
            ×
          </button>
        </div>

        {/* ================================
            FORM
        ================================= */}
        <form
          onSubmit={handleSubmit}
          className="
            flex
            min-h-0
            flex-1
            flex-col
            bg-white
          "
        >
          {/* ================================
              SCROLLABLE CONTENT
          ================================= */}
          <div
            className="
              min-h-0
              flex-1
              overflow-y-auto
              bg-white
              px-6
              py-5
            "
          >
            <div className="space-y-5">

              {/* QUESTION */}
              <div>
                <label
                  htmlFor="flashcard-question"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-900
                  "
                >
                  Question
                </label>

                <textarea
                  id="flashcard-question"
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  placeholder="e.g. What is polymorphism in OOP?"
                  rows={3}
                  disabled={isSubmitting}
                  className="
                    block
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-gray-900
                    outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-gray-400
                    focus:ring-2
                    focus:ring-gray-200
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                    disabled:opacity-60
                  "
                />
              </div>

              {/* ANSWER */}
              <div>
                <label
                  htmlFor="flashcard-answer"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-900
                  "
                >
                  Answer
                </label>

                <textarea
                  id="flashcard-answer"
                  value={answer}
                  onChange={(event) =>
                    setAnswer(event.target.value)
                  }
                  placeholder="Write the answer..."
                  rows={4}
                  disabled={isSubmitting}
                  className="
                    block
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-gray-900
                    outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-gray-400
                    focus:ring-2
                    focus:ring-gray-200
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                    disabled:opacity-60
                  "
                />
              </div>

              {/* HINT */}
              <div>
                <label
                  htmlFor="flashcard-hint"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-900
                  "
                >
                  Hint
                  <span className="ml-1 font-normal text-gray-500">
                    (optional)
                  </span>
                </label>

                <input
                  id="flashcard-hint"
                  type="text"
                  value={hint}
                  onChange={(event) =>
                    setHint(event.target.value)
                  }
                  placeholder="Add a small clue..."
                  disabled={isSubmitting}
                  className="
                    block
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-gray-900
                    outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-gray-400
                    focus:ring-2
                    focus:ring-gray-200
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                    disabled:opacity-60
                  "
                />
              </div>

              {/* DIFFICULTY */}
              <div>
                <label
                  htmlFor="flashcard-difficulty"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-900
                  "
                >
                  Difficulty
                </label>

                <select
                  id="flashcard-difficulty"
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(
                      event.target.value as FlashcardDifficulty
                    )
                  }
                  disabled={isSubmitting}
                  className="
                    block
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-gray-900
                    outline-none
                    transition
                    focus:border-gray-400
                    focus:ring-2
                    focus:ring-gray-200
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                    disabled:opacity-60
                  "
                >
                  {DIFFICULTIES.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* TAGS */}
              <div>
                <label
                  htmlFor="flashcard-tags"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-900
                  "
                >
                  Tags
                  <span className="ml-1 font-normal text-gray-500">
                    (optional)
                  </span>
                </label>

                <input
                  id="flashcard-tags"
                  type="text"
                  value={tags}
                  onChange={(event) =>
                    setTags(event.target.value)
                  }
                  placeholder="e.g. algorithms, sorting, important"
                  disabled={isSubmitting}
                  className="
                    block
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-gray-900
                    outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-gray-400
                    focus:ring-2
                    focus:ring-gray-200
                    disabled:cursor-not-allowed
                    disabled:bg-gray-50
                    disabled:opacity-60
                  "
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Separate multiple tags with commas.
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <div
                  role="alert"
                  className="
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    text-red-600
                  "
                >
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* ================================
              FOOTER
          ================================= */}
          <div
            className="
              flex
              shrink-0
              items-center
              justify-end
              gap-3
              border-t
              border-gray-200
              bg-white
              px-6
              py-4
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="
                rounded-xl
                border
                border-gray-300
                bg-white
                px-5
                py-2.5
                text-sm
                font-medium
                text-gray-700
                transition
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="
                rounded-xl
                bg-primary
                px-5
                py-2.5
                text-sm
                font-medium
                text-primary-foreground
                shadow-sm
                transition
                hover:bg-primary/90
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isSubmitting
                ? "Creating..."
                : "Create Flashcard"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}