"use client";

import { Note } from "@/types/note";
import NoteCard from "./NoteCard";

interface Props {
  notes: Note[];
}

export default function NoteList({
  notes,
}: Props) {

  if (notes.length === 0) {
    return (
      <div className="card p-10 text-center">

        <h3 className="text-lg font-semibold">
          No Notes
        </h3>

        <p className="text-muted-foreground mt-2">
          Create your first note.
        </p>

      </div>
    );
  }

  return (
    <div className="grid gap-4">

      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
        />
      ))}

    </div>
  );
}