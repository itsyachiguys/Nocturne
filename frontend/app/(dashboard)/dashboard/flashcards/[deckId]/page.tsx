"use client";

import { onAuthStateChanged } from "firebase/auth";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  IconArrowLeft,
  IconCards,
  IconPlus,
  IconTrash,
  IconPlayerPlay,
  IconBulb,
  IconEye,
  IconCheck,
  IconX,
  IconClock,
  IconRefresh,
} from "@tabler/icons-react";

import { FlashcardService } from "@/services/flashcard.service";
import { auth } from "@/lib/firebase";

import type {
  CreateFlashcardData,
  Flashcard,
  FlashcardDeck,
} from "@/types/flashcard";

import CreateFlashcardModal from "@/components/flashcards/CreateFlashcardModal";
import FlashcardList from "@/components/flashcards/FlashcardList";

const STUDY_TIME = 30;

const STOP_WORDS = new Set([
  "a", "an", "and", "or", "the", "of", "to", "is", "are",
  "in", "on", "for", "with", "as", "by", "it", "its",
  "that", "this", "these", "those",
]);

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Splits into key words; filler words are ignored unless nothing else is left.
function toTokens(value: string) {
  const all = normalizeText(value).split(" ").filter(Boolean);
  const meaningful = all.filter((token) => !STOP_WORDS.has(token));
  return meaningful.length > 0 ? meaningful : all;
}

function editDistance(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );

      // swapped neighbouring letters count as one mistake
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }

  return dp[a.length][b.length];
}

// Allows 1 typo in words of 5+ letters, 2 typos in words of 9+ letters.
//function tokensMatch(a: string, b: string) {
  //if (a === b) return true;

  //const longest = Math.max(a.length, b.length);
  //const allowed = longest >= 9 ? 2 : longest >= 5 ? 1 : 0;

  //return allowed > 0 && editDistance(a, b) <= allowed;
//}

type MatchKind = "exact" | "typo" | "short" | null;

type TypoHint = {
  typed: string;
  expected: string;
  kind: "typo" | "short";
};

function getMatchKind(a: string, b: string): MatchKind {
  if (a === b) return "exact";

  const longest = Math.max(a.length, b.length);
  const shortest = Math.min(a.length, b.length);

  // Misspelling: 1 mistake for 5+ letters, 2 for 9+ letters
  const allowed = longest >= 9 ? 2 : longest >= 5 ? 1 : 0;

  if (allowed > 0 && editDistance(a, b) <= allowed) return "typo";

  // Shortened form: struct -> structure, algos -> algorithm
  if (shortest >= 4) {
    let prefix = 0;

    while (prefix < shortest && a[prefix] === b[prefix]) {
      prefix++;
    }

    if (prefix >= 4 && prefix / shortest >= 0.8) return "short";
  }

  return null;
}

type AnswerCheck = { correct: boolean; typos: TypoHint[] };

function checkAnswerMatch(
  userInput: string,
  correctAnswer: string
): AnswerCheck {
  if (normalizeText(userInput) === normalizeText(correctAnswer)) {
    return { correct: true, typos: [] };
  }

  const user = toTokens(userInput);
  const correct = toTokens(correctAnswer);

  if (user.length === 0 || correct.length === 0) {
    return { correct: false, typos: [] };
  }

  const used = new Set<number>();
  const hints: TypoHint[] = [];
  let matched = 0;

  for (const word of correct) {
    let foundIndex = -1;
    let foundKind: MatchKind = null;

    for (let i = 0; i < user.length; i++) {
      if (used.has(i)) continue;

      const kind = getMatchKind(user[i], word);

      if (kind) {
        foundIndex = i;
        foundKind = kind;
        break;
      }
    }

    if (foundIndex !== -1) {
      used.add(foundIndex);
      matched++;

      if (foundKind === "typo" || foundKind === "short") {
        hints.push({
          typed: user[foundIndex],
          expected: word,
          kind: foundKind,
        });
      }
    }
  }

  const recall = matched / correct.length;
  const precision = matched / user.length;

  return {
    correct: recall >= 0.8 && precision >= 0.4,
    typos: hints,
  };
}

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
  const [error, setError] = useState("");

  // =========================================================
  // STUDY MODE
  // =========================================================

  const [isStudying, setIsStudying] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STUDY_TIME);

  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const [typedAnswer, setTypedAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [typoHints, setTypoHints] = useState<TypoHint[]>([]);

  const [answering, setAnswering] = useState(false);

  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [studyComplete, setStudyComplete] = useState(false);

  const currentCard = cards[studyIndex];

  // =========================================================
  // LOAD DECK
  // =========================================================
  useEffect(() => {
    if (!deckId) return;
  
    let cancelled = false;
  
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const deckData = await FlashcardService.getDeck(deckId).catch((e) => {
          console.error("getDeck failed:", e);
          throw e;
        });
      
        const cardData = await FlashcardService.getCards(deckId, user.uid).catch(
          (e) => {
            console.error("getCards failed:", e);
            throw e;
          }
        );
      
        if (cancelled) return;
      
        setDeck(deckData);
        setCards(cardData);
      } catch (err) {
        console.error("Failed to load flashcard deck:", err);
  
        if (!cancelled) {
          setError("Failed to load flashcard deck.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });
  
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [deckId, router]);

  // =========================================================
  // 30 SECOND STUDY TIMER
  // =========================================================

  useEffect(() => {
    if (!isStudying || studyComplete || showAnswer) {
      return;
    }

    if (timeLeft <= 0) {
      setShowAnswer(true);
      setAnswerResult("incorrect");
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isStudying, studyComplete, showAnswer, timeLeft]);

  // =========================================================
  // ADD CARD
  // =========================================================

  async function handleAddCard(data: CreateFlashcardData) {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("You must be logged in.");
    }

    if (user.uid !== data.studentId) {
      throw new Error("You are not authorized to add this card.");
    }

    if (data.deckId !== deckId) {
      throw new Error("Invalid flashcard deck.");
    }

    try {
      setSavingCard(true);
      setError("");

      const cardId = await FlashcardService.createCard(data);

      const newCard = await FlashcardService.getCard(cardId);

      if (newCard) {
        setCards((current) => [...current, newCard]);
      }

      setDeck((current) =>
        current
          ? {
              ...current,
              cardCount: current.cardCount + 1,
            }
          : current
      );

      setShowAddCard(false);
    } catch (error) {
      console.error("Failed to create flashcard:", error);

      throw error instanceof Error
        ? error
        : new Error("Failed to create flashcard.");
    } finally {
      setSavingCard(false);
    }
  }

  // =========================================================
  // DELETE CARD
  // =========================================================

  async function handleDeleteCard(cardId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this flashcard?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await FlashcardService.deleteCard(cardId, deckId);

      setCards((current) =>
        current.filter((card) => card.id !== cardId)
      );

      setDeck((current) =>
        current
          ? {
              ...current,
              cardCount: Math.max(0, current.cardCount - 1),
            }
          : current
      );
    } catch (error) {
      console.error("Failed to delete flashcard:", error);
      setError("Failed to delete flashcard.");
    }
  }

  // =========================================================
  // DELETE DECK
  // =========================================================

  async function handleDeleteDeck() {
    if (!deck) return;

    const confirmed = window.confirm(
      `Delete "${deck.title}"?\n\nThis will permanently delete the deck and all of its flashcards.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      await FlashcardService.deleteDeck(deck.id, deck.studentId);

      router.push("/dashboard/flashcards");
    } catch (error) {
      console.error("Failed to delete flashcard deck:", error);

      setError("Failed to delete flashcard deck.");
      setDeleting(false);
    }
  }

  // =========================================================
  // NORMALIZE ANSWER
  // =========================================================

  //function normalizeAnswer(value: string) {
    //return value
      //.toLowerCase()
      //.trim()
      //.replace(/[^\w\s]/g, "")
      //.replace(/\s+/g, " ");
  //}

  // =========================================================
  // CHECK ANSWER
  // =========================================================

  function checkAnswer() {
    if (!currentCard || !typedAnswer.trim()) {
      return;
    }
  
    const result = checkAnswerMatch(typedAnswer, currentCard.answer);
  
    setAnswerResult(result.correct ? "correct" : "incorrect");
    setTypoHints(result.typos);
    setShowAnswer(true);
  }

  // =========================================================
  // START STUDY
  // =========================================================

  function startStudy() {
    if (cards.length === 0) {
      setError(
        "Add at least one flashcard before starting study mode."
      );
      return;
    }

    setError("");
    setStudyIndex(0);
    setTimeLeft(STUDY_TIME);

    setShowHint(false);
    setShowAnswer(false);

    setTypedAnswer("");
    setAnswerResult(null);
    setTypoHints([]);

    setCorrectAnswers(0);
    setIncorrectAnswers(0);

    setStudyComplete(false);
    setAnswering(false);

    setIsStudying(true);
  }

  // =========================================================
  // EXIT STUDY
  // =========================================================

  function exitStudy() {
    setIsStudying(false);

    setStudyIndex(0);
    setTimeLeft(STUDY_TIME);

    setShowHint(false);
    setShowAnswer(false);

    setTypedAnswer("");
    setAnswerResult(null);
    setTypoHints([]);

    setStudyComplete(false);
    setAnswering(false);
  }

  // =========================================================
  // SAVE ANSWER + MOVE TO NEXT CARD
  // =========================================================

  async function handleAnswer(
    result: "again" | "good"
  ) {
    if (!currentCard || answering) return;

    try {
      setAnswering(true);
      setError("");

      await FlashcardService.recordAnswer(
        currentCard.id,
        result
      );

      if (result === "good") {
        setCorrectAnswers((current) => current + 1);
      } else {
        setIncorrectAnswers((current) => current + 1);
      }

      const nextIndex = studyIndex + 1;

      if (nextIndex >= cards.length) {
        setStudyComplete(true);
        return;
      }

      setStudyIndex(nextIndex);

      setTimeLeft(STUDY_TIME);

      setShowHint(false);
      setShowAnswer(false);

      setTypedAnswer("");
      setAnswerResult(null);
      setTypoHints([]);
    } catch (error) {
      console.error("Failed to record answer:", error);

      setError(
        "Failed to save your answer. Please try again."
      );
    } finally {
      setAnswering(false);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
          Loading flashcard deck...
        </p>
      </div>
    );
  }

  // =========================================================
  // DECK NOT FOUND
  // =========================================================

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
          This flashcard deck does not exist or is no longer
          available.
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

  // =========================================================
  // STUDY MODE
  // =========================================================

  if (isStudying) {
    return (
      <div className="min-h-[calc(100vh-3rem)]">
        <div className="mx-auto max-w-4xl">
          {/* STUDY HEADER */}

          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={exitStudy}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-secondary transition hover:text-lavender-dark dark:text-ink-secondary-dark"
            >
              <IconArrowLeft size={18} />
              Exit Study
            </button>

            {!studyComplete && (
              <div className="rounded-full bg-lavender/10 px-4 py-2 text-sm font-semibold text-lavender-dark">
                {studyIndex + 1} / {cards.length}
              </div>
            )}
          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* =================================================
              STUDY COMPLETE
              ================================================= */}

          {studyComplete ? (
            <div className="card overflow-hidden bg-white p-8 text-center shadow-sm dark:bg-white md:p-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-lavender/10 text-lavender-dark">
                <IconCheck size={40} />
              </div>

              <h1 className="text-3xl font-bold text-ink-primary">
                Deck Complete!
              </h1>

              <p className="mt-3 text-ink-secondary">
                Great job! You finished all {cards.length}{" "}
                {cards.length === 1 ? "card" : "cards"}.
              </p>

              <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-4">
                <div className="rounded-2xl bg-green-50 p-5">
                  <div className="text-3xl font-bold text-green-600">
                    {correctAnswers}
                  </div>

                  <div className="mt-1 text-sm font-medium text-green-700">
                    Correct
                  </div>
                </div>

                <div className="rounded-2xl bg-red-50 p-5">
                  <div className="text-3xl font-bold text-red-600">
                    {incorrectAnswers}
                  </div>

                  <div className="mt-1 text-sm font-medium text-red-700">
                    Incorrect
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm text-ink-secondary">
                  Accuracy
                </div>

                <div className="mt-1 text-2xl font-bold text-ink-primary">
                  {cards.length > 0
                    ? Math.round(
                        (correctAnswers / cards.length) * 100
                      )
                    : 0}
                  %
                </div>
              </div>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={startStudy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-lavender px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <IconRefresh size={18} />
                  Study Again
                </button>

                <button
                  type="button"
                  onClick={exitStudy}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-ink-primary transition hover:bg-gray-50"
                >
                  Back to Deck
                </button>
              </div>
            </div>
          ) : currentCard ? (
            <>
              {/* PROGRESS */}

              <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-lavender transition-all duration-300"
                  style={{
                    width: `${
                      ((studyIndex + 1) / cards.length) * 100
                    }%`,
                  }}
                />
              </div>

              {/* TIMER */}

              <div className="mb-6 flex justify-center">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold ${
                    timeLeft <= 5
                      ? "bg-red-100 text-red-600"
                      : "bg-lavender/10 text-lavender-dark"
                  }`}
                >
                  <IconClock size={18} />

                  {timeLeft}s
                </div>
              </div>

              {/* FLASHCARD */}

              <div className="card overflow-hidden bg-white shadow-sm dark:bg-white">
                {/* QUESTION */}

                <div className="p-7 md:p-10">
                  <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-lavender-dark">
                    Question
                  </div>

                  <h1 className="text-2xl font-bold leading-relaxed text-ink-primary md:text-3xl">
                    {currentCard.question}
                  </h1>

                  {/* HINT */}

                  {currentCard.hint && !showAnswer && (
                    <div className="mt-8">
                      {!showHint ? (
                        <button
                          type="button"
                          onClick={() => setShowHint(true)}
                          className="inline-flex items-center gap-2 rounded-xl border border-lavender/30 bg-lavender/5 px-4 py-2.5 text-sm font-semibold text-lavender-dark transition hover:bg-lavender/10"
                        >
                          <IconBulb size={18} />
                          Show Hint
                        </button>
                      ) : (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <div className="flex items-start gap-3">
                            <IconBulb
                              size={20}
                              className="mt-0.5 shrink-0 text-amber-600"
                            />

                            <div>
                              <div className="text-sm font-semibold text-amber-800">
                                Hint
                              </div>

                              <p className="mt-1 text-sm leading-relaxed text-amber-700">
                                {currentCard.hint}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ANSWER RESULT */}

                  {showAnswer && (
                    <div className="mt-8 space-y-4">
                      {/* CORRECT / INCORRECT MESSAGE */}

                      {answerResult === "correct" && (
                        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                          <div className="flex items-center gap-2 text-lg font-bold text-green-700">
                            <IconCheck size={22} />
                            Correct!
                          </div>

                          <p className="mt-2 text-sm text-green-700">
                            Great job! Your answer matches the
                            correct answer.
                          </p>
                        </div>
                      )}

                      {answerResult === "incorrect" && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                          <div className="flex items-center gap-2 text-lg font-bold text-red-700">
                            <IconX size={22} />
                            Incorrect
                          </div>

                          {timeLeft === 0 && (
                            <p className="mt-2 text-sm text-red-700">
                              Time is up. The correct answer is
                              shown below.
                            </p>
                          )}
                        </div>
                      )}
                      {/* TYPO HINTS */}
                      {typoHints.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                          <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
                            <IconBulb size={18} />
                            Accepted, but check these
                          </div>

                          <ul className="mt-2 space-y-1 text-sm text-amber-700">
                            {typoHints.map((hint, index) => (
                              <li key={index}>
                                <span className="font-medium">
                                  {hint.kind === "typo" ? "Spelling: " : "Short form: "}
                                </span>
                                <span className="line-through">{hint.typed}</span>
                                {" → "}
                                <span className="font-semibold">{hint.expected}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* USER ANSWER */}

                      {typedAnswer.trim() && (
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Your Answer
                          </div>

                          <p className="text-base leading-relaxed text-gray-900">
                            {typedAnswer}
                          </p>
                        </div>
                      )}

                      {/* CORRECT ANSWER */}

                      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-700">
                          <IconEye size={16} />
                          Correct Answer
                        </div>

                        <p className="text-base leading-relaxed text-green-900">
                          {currentCard.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTION AREA */}

                <div className="border-t border-gray-100 bg-gray-50/80 p-6">
                  {!showAnswer ? (
                    <div className="space-y-4">
                      {/* ANSWER INPUT */}

                      <div>
                        <label
                          htmlFor="study-answer"
                          className="mb-2 block text-sm font-semibold text-ink-primary"
                        >
                          Your Answer
                        </label>

                        <textarea
                          id="study-answer"
                          value={typedAnswer}
                          onChange={(event) =>
                            setTypedAnswer(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" &&
                              (event.ctrlKey || event.metaKey)
                            ) {
                              event.preventDefault();
                              checkAnswer();
                            }
                          }}
                          placeholder="Type your answer here..."
                          rows={4}
                          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-lavender focus:ring-2 focus:ring-lavender/20"
                        />

                        <p className="mt-2 text-xs text-gray-500">
                          Press Ctrl + Enter to check your answer.
                        </p>
                      </div>

                      {/* CHECK ANSWER */}

                      <button
                        type="button"
                        onClick={checkAnswer}
                        disabled={!typedAnswer.trim()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-lavender px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <IconCheck size={19} />
                        Check Answer
                      </button>

                      {/* REVEAL ANSWER */}

                      <button
                        type="button"
                        onClick={() => {
                          setAnswerResult("incorrect");
                          setShowAnswer(true);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-ink-secondary transition hover:bg-gray-50"
                      >
                        <IconEye size={18} />
                        Reveal Answer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* MANUAL RESULT SELECTION */}

                      {answerResult === null && (
                        <>
                          <p className="text-center text-sm font-medium text-ink-secondary">
                            How did you do?
                          </p>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              disabled={answering}
                              onClick={() =>
                                handleAnswer("again")
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <IconX size={19} />
                              I Didn't Know
                            </button>

                            <button
                              type="button"
                              disabled={answering}
                              onClick={() =>
                                handleAnswer("good")
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <IconCheck size={19} />
                              I Knew It
                            </button>
                          </div>
                        </>
                      )}

                      {/* AUTOMATIC RESULT */}

                      {answerResult !== null && (
                        <button
                          type="button"
                          disabled={answering}
                          onClick={() =>
                            handleAnswer(
                              answerResult === "correct"
                                ? "good"
                                : "again"
                            )
                          }
                          className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            answerResult === "correct"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-lavender hover:opacity-90"
                          }`}
                        >
                          {answering ? (
                            "Saving..."
                          ) : (
                            <>
                              <IconArrowLeft
                                size={18}
                                className="rotate-180"
                              />

                              {studyIndex + 1 === cards.length
                                ? "Finish Deck"
                                : "Next Card"}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* STUDY STATS */}

              <div className="mt-5 flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <IconCheck size={16} />
                  {correctAnswers} correct
                </div>

                <div className="flex items-center gap-2 text-red-500">
                  <IconX size={16} />
                  {incorrectAnswers} incorrect
                </div>
              </div>
            </>
          ) : (
            <div className="card bg-white p-8 text-center">
              <p className="text-sm text-ink-secondary">
                No flashcard available.
              </p>

              <button
                type="button"
                onClick={exitStudy}
                className="mt-5 rounded-xl bg-lavender px-5 py-2.5 text-sm font-semibold text-white"
              >
                Back to Deck
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // NORMAL DECK VIEW
  // =========================================================

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
                {cards.length === 1 ? "card" : "cards"}
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS */}

          <div className="flex flex-wrap gap-2">
            {cards.length > 0 && (
              <button
                type="button"
                onClick={startStudy}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                <IconPlayerPlay size={18} />
                Play
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowAddCard(true);
              }}
              disabled={savingCard}
              className="inline-flex items-center gap-2 rounded-xl bg-lavender px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
              {deleting ? "Deleting..." : "Delete Deck"}
            </button>
          </div>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
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
            This deck is empty. Add your first flashcard to
            start studying.
          </p>

          <button
            type="button"
            onClick={() => {
              setError("");
              setShowAddCard(true);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-lavender px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <IconPlus size={18} />
            Add First Card
          </button>
        </div>
      ) : (
        <FlashcardList
          cards={cards}
          onDelete={handleDeleteCard}
        />
      )}

      {/* CREATE FLASHCARD MODAL */}

      <CreateFlashcardModal
        isOpen={showAddCard}
        onClose={() => {
          if (savingCard) return;
          setShowAddCard(false);
        }}
        onCreate={handleAddCard}
        deckId={deckId}
        studentId={deck.studentId}
      />
    </div>
  );
}