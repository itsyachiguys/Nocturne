"use client";

import { useEffect, useRef, useState } from "react";

import { NoteService } from "@/services/note.service";

interface Props {
  studentId: string;
  subjectId: string;
  moduleId: string;
}

export default function NotesEditor({
  studentId,
  subjectId,
  moduleId,
}: Props) {
  const [noteId, setNoteId] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Saved");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadNote() {
      const notes = await NoteService.getByModule(moduleId);

      if (notes) {
        setNoteId(notes.id);
        setContent(notes.content);
        return;
      }

      const id = await NoteService.create({
        studentId,
        subjectId,
        moduleId,
        title: "Notes",
        content: "",
      });

      setNoteId(id);
    }

    loadNote();
  }, [moduleId, studentId, subjectId]);

  async function save(value: string) {
    if (!noteId) return;

    setStatus("Saving...");

    await NoteService.update(noteId, value);

    setStatus("Saved");
  }

  function handleChange(
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    const value = e.target.value;

    setContent(value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save(value);
    }, 1000);
  }

  return (
    <div className="card rounded-2xl p-6">

      <div className="mb-4 flex justify-end">

        <span className="text-sm text-zinc-500">
          {status}
        </span>

      </div>

      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Start writing your notes..."
        className="min-h-[600px] w-full resize-none border-none bg-transparent outline-none"
      />

    </div>
  );
}