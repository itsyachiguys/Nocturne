"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Note } from "@/types/note";
import { NoteService } from "@/services/note.service";
import { SubjectService } from "@/services/subject.service";
import { ModuleService } from "@/services/module.service";

import NotesEditor from "@/components/notes/NotesEditor";

export default function NotePage() {
  const params = useParams();

  const noteId = params.noteId as string;

  const [note, setNote] = useState<Note | null>(null);

  const [subjectName, setSubjectName] = useState<string | null>(
    null
  );

  const [moduleName, setModuleName] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNote() {
      try {
        const data = await NoteService.get(noteId);

        if (!data) {
          setNote(null);
          return;
        }

        setNote(data);

        // Load subject information if this is an academic note
        if (data.subjectId) {
          try {
            const subject = await SubjectService.get(
              data.subjectId
            );

            if (subject) {
              setSubjectName(subject.name);
            }
          } catch (error) {
            console.error(
              "Failed to load subject:",
              error
            );
          }
        }

        // Load module information if the note belongs to a module
        if (data.moduleId) {
          try {
            const module = await ModuleService.get(
              data.moduleId
            );

            if (module) {
              setModuleName(module.name);
            }
          } catch (error) {
            console.error(
              "Failed to load module:",
              error
            );
          }
        }
      } catch (error) {
        console.error("Failed to load note:", error);
      } finally {
        setLoading(false);
      }
    }

    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-zinc-500">
          Loading note...
        </p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="mb-4 text-5xl">📝</div>

        <h1 className="text-2xl font-semibold">
          Note not found
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          This note may have been deleted or is no longer
          available.
        </p>

        <Link
          href="/dashboard/notes"
          className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-700"
        >
          ← Back to Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Back navigation */}

      <Link
        href="/dashboard/notes"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-violet-600"
      >
        ← Back to Notes
      </Link>

      {/* Note metadata */}

      <div className="flex flex-wrap items-center gap-2">

        {/* Category */}

        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
          {note.category}
        </span>

        {/* Subject */}

        {subjectName && (
          <>
            <span className="text-zinc-300">•</span>

            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              📚 {subjectName}
            </span>
          </>
        )}

        {/* Module */}

        {moduleName && (
          <>
            <span className="text-zinc-300">•</span>

            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              📖 {moduleName}
            </span>
          </>
        )}

      </div>

      {/* Editor */}

      <NotesEditor note={note} />

    </div>
  );
}