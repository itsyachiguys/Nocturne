"use client";

import { useMemo } from "react";

import { Note } from "@/types/note";
import NoteCard from "./NoteCard";

interface Props {
  notes: Note[];
}

export default function NoteList({
  notes,
}: Props) {
  const visibleNotes = useMemo(() => {
    return [...notes]
      .filter((note) => !note.archived)
      .sort((a, b) => {
        if (a.pinned === b.pinned) {
          return 0;
        }

        return a.pinned ? -1 : 1;
      });
  }, [notes]);

  if (visibleNotes.length === 0) {
    return (
      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          border-zinc-300
          bg-zinc-50
          py-20
          text-center
          dark:border-white/15
          dark:bg-white/[0.03]
        "
      >
        <div className="mb-4 text-6xl">
          📝
        </div>

        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          No notes yet
        </h2>

        <p className="mt-3 max-w-md text-zinc-500 dark:text-zinc-400">
          Create your first note and organize it by
          subject, module, category and tags.
          Your notes automatically save as you write.
        </p>
      </div>
    );
  }

  const pinnedNotes = visibleNotes.filter(
    (note) => note.pinned
  );

  const regularNotes = visibleNotes.filter(
    (note) => !note.pinned
  );

  return (
    <div className="space-y-8">

      {/* =====================================================
          PINNED NOTES
      ===================================================== */}

      {pinnedNotes.length > 0 && (
        <section>

          <div className="mb-4 flex items-center gap-2">

            <span className="text-xl">
              📌
            </span>

            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Pinned
            </h2>

          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
              />
            ))}

          </div>

        </section>
      )}

      {/* =====================================================
          ALL NOTES
      ===================================================== */}

      {regularNotes.length > 0 && (
        <section>

          <div className="mb-4 flex items-center gap-2">

            <span className="text-xl">
              📚
            </span>

            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              All Notes
            </h2>

          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {regularNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
              />
            ))}

          </div>

        </section>
      )}

    </div>
  );
}