import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
  } from "firebase/firestore";
  
  import { db } from "@/lib/firebase";
  
  import {
    CreateFlashcardData,
    CreateFlashcardDeckData,
    Flashcard,
    FlashcardDeck,
    UpdateFlashcardData,
    UpdateFlashcardDeckData,
  } from "@/types/flashcard";
  
  const DECKS_COLLECTION = "flashcard_decks";
  const CARDS_COLLECTION = "flashcards";
  
  export const FlashcardService = {
    /* =========================================================
       DECKS
       ========================================================= */
  
    async createDeck(
      data: CreateFlashcardDeckData
    ): Promise<string> {
      const deckRef = await addDoc(
        collection(db, DECKS_COLLECTION),
        {
          ...data,
          cardCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
  
      return deckRef.id;
    },
  
    async getDeck(
      deckId: string
    ): Promise<FlashcardDeck | null> {
      const snapshot = await getDoc(
        doc(db, DECKS_COLLECTION, deckId)
      );
  
      if (!snapshot.exists()) {
        return null;
      }
  
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as FlashcardDeck;
    },
  
    async getDecks(
      studentId: string
    ): Promise<FlashcardDeck[]> {
      const q = query(
        collection(db, DECKS_COLLECTION),
        where("studentId", "==", studentId),
        orderBy("updatedAt", "desc")
      );
  
      const snapshot = await getDocs(q);
  
      return snapshot.docs.map(
        (item) =>
          ({
            id: item.id,
            ...item.data(),
          }) as FlashcardDeck
      );
    },
  
    async updateDeck(
      deckId: string,
      data: UpdateFlashcardDeckData
    ): Promise<void> {
      await updateDoc(
        doc(db, DECKS_COLLECTION, deckId),
        {
          ...data,
          updatedAt: serverTimestamp(),
        }
      );
    },
  
    async deleteDeck(deckId: string): Promise<void> {
      const cards = await this.getCards(deckId);
  
      await Promise.all(
        cards.map((card) =>
          deleteDoc(
            doc(db, CARDS_COLLECTION, card.id)
          )
        )
      );
  
      await deleteDoc(
        doc(db, DECKS_COLLECTION, deckId)
      );
    },
  
    /* =========================================================
       FLASHCARDS
       ========================================================= */
  
    async createCard(
      data: CreateFlashcardData
    ): Promise<string> {
      const cardRef = await addDoc(
        collection(db, CARDS_COLLECTION),
        {
          ...data,
          difficulty: data.difficulty ?? "new",
          correctCount: 0,
          incorrectCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
  
      await this.incrementDeckCardCount(
        data.deckId,
        1
      );
  
      return cardRef.id;
    },
  
    async getCard(
      cardId: string
    ): Promise<Flashcard | null> {
      const snapshot = await getDoc(
        doc(db, CARDS_COLLECTION, cardId)
      );
  
      if (!snapshot.exists()) {
        return null;
      }
  
      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as Flashcard;
    },
  
    async getCards(
      deckId: string
    ): Promise<Flashcard[]> {
      const q = query(
        collection(db, CARDS_COLLECTION),
        where("deckId", "==", deckId),
        orderBy("createdAt", "asc")
      );
  
      const snapshot = await getDocs(q);
  
      return snapshot.docs.map(
        (item) =>
          ({
            id: item.id,
            ...item.data(),
          }) as Flashcard
      );
    },
  
    async updateCard(
      cardId: string,
      data: UpdateFlashcardData
    ): Promise<void> {
      await updateDoc(
        doc(db, CARDS_COLLECTION, cardId),
        {
          ...data,
          updatedAt: serverTimestamp(),
        }
      );
    },
  
    async deleteCard(
      cardId: string,
      deckId: string
    ): Promise<void> {
      await deleteDoc(
        doc(db, CARDS_COLLECTION, cardId)
      );
  
      await this.incrementDeckCardCount(
        deckId,
        -1
      );
    },
  
    /* =========================================================
       STUDY PROGRESS
       ========================================================= */
  
    async recordAnswer(
      cardId: string,
      result: "again" | "hard" | "good" | "easy"
    ): Promise<void> {
      const cardRef = doc(
        db,
        CARDS_COLLECTION,
        cardId
      );
  
      const snapshot = await getDoc(cardRef);
  
      if (!snapshot.exists()) {
        throw new Error("Flashcard not found.");
      }
  
      const card = snapshot.data();
  
      const currentCorrect =
        typeof card.correctCount === "number"
          ? card.correctCount
          : 0;
  
      const currentIncorrect =
        typeof card.incorrectCount === "number"
          ? card.incorrectCount
          : 0;
  
      const isCorrect =
        result === "good" ||
        result === "easy";
  
      await updateDoc(cardRef, {
        difficulty: result,
        correctCount: isCorrect
          ? currentCorrect + 1
          : currentCorrect,
        incorrectCount: isCorrect
          ? currentIncorrect
          : currentIncorrect + 1,
        lastReviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
  
    /* =========================================================
       INTERNAL HELPERS
       ========================================================= */
  
    async incrementDeckCardCount(
      deckId: string,
      amount: number
    ): Promise<void> {
      const deckRef = doc(
        db,
        DECKS_COLLECTION,
        deckId
      );
  
      const snapshot = await getDoc(deckRef);
  
      if (!snapshot.exists()) {
        return;
      }
  
      const currentCount =
        typeof snapshot.data().cardCount === "number"
          ? snapshot.data().cardCount
          : 0;
  
      await updateDoc(deckRef, {
        cardCount: Math.max(
          0,
          currentCount + amount
        ),
        updatedAt: serverTimestamp(),
      });
    },
  };