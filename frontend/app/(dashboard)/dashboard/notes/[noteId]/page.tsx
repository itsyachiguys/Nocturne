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

  const [subjectName, setSubjectName] =
    useState<string | null>(null);

  const [moduleName, setModuleName] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadNote() {
      try {
        const data =
          await NoteService.get(noteId);

        if (!data) {
          setNote(null);
          return;
        }

        setNote(data);

        if (data.subjectId) {
          try {
            const subject =
              await SubjectService.get(
                data.subjectId
              );

            if (subject) {
              setSubjectName(
                subject.name
              );
            }
          } catch (error) {
            console.error(
              "Failed to load subject:",
              error
            );
          }
        }

        if (data.moduleId) {
          try {
            const module =
              await ModuleService.get(
                data.moduleId
              );

            if (module) {
              setModuleName(
                module.name
              );
            }
          } catch (error) {
            console.error(
              "Failed to load module:",
              error
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load note:",
          error
        );
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading note...
        </p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="mb-4 text-5xl">
          📝
        </div>

        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Note not found
        </h1>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
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

      {/* NOTE METADATA */}

      <div className="flex flex-wrap items-center gap-2">

        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          {note.category}
        </span>

        {subjectName && (
          <>
            <span className="text-zinc-400 dark:text-zinc-500">
              •
            </span>

            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
              📚 {subjectName}
            </span>
          </>
        )}

        {moduleName && (
          <>
            <span className="text-zinc-400 dark:text-zinc-500">
              •
            </span>

            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
              📖 {moduleName}
            </span>
          </>
        )}

      </div>

      <NotesEditor note={note} />

    </div>
  );
}