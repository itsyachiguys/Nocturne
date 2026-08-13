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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">

        <div className="mb-4 text-6xl">
          📝
        </div>

        <h2 className="text-2xl font-semibold">
          No notes yet
        </h2>

        <p className="mt-3 max-w-md text-zinc-500">
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

      {pinnedNotes.length > 0 && (
        <section>

          <div className="mb-4 flex items-center gap-2">

            <span className="text-xl">
              📌
            </span>

            <h2 className="text-lg font-semibold">
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

      <section>

        <div className="mb-4 flex items-center gap-2">

          <span className="text-xl">
            📚
          </span>

          <h2 className="text-lg font-semibold">
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

    </div>
  );
}