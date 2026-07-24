"use client";

import Link from "next/link";
import { Note } from "@/types/note";

interface Props {
  note: Note;
}

export default function NoteCard({
  note,
}: Props) {
  return (
    <Link href={`/dashboard/notes/${note.id}`}>
      <div className="card p-5 hover:shadow-lg transition cursor-pointer">

        <h3 className="text-lg font-semibold">
          {note.title}
        </h3>

        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
          {note.content || "No content yet..."}
        </p>

      </div>
    </Link>
  );
}