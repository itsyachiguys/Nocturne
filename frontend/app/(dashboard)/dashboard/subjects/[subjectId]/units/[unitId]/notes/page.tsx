"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Module } from "@/types/module";
import { Note } from "@/types/note";

import { ModuleService } from "@/services/module.service";
import { NoteService } from "@/services/note.service";

import NotesEditor from "@/components/notes/NotesEditor";
import AISidebar from "@/components/notes/AISidebar";

export default function NotesPage() {
  const params = useParams();

  const subjectId = params.subjectId as string;
  const unitId = params.unitId as string;

  const [module, setModule] = useState<Module | null>(null);
  const [note, setNote] = useState<Note | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNotesPage() {
      try {
        setLoading(true);
        setError(null);

        /*
         * =====================================================
         * LOAD MODULE
         * =====================================================
         */

        const moduleData = await ModuleService.get(unitId);

        if (!moduleData) {
          if (!cancelled) {
            setModule(null);
            setNote(null);
            setError("Module not found.");
          }

          return;
        }

        if (!cancelled) {
          setModule(moduleData);
        }

        /*
         * =====================================================
         * LOAD EXISTING NOTES FOR THIS MODULE
         * =====================================================
         */

        const notes = await NoteService.getByModule(unitId);

        if (cancelled) {
          return;
        }

        /*
         * =====================================================
         * USE EXISTING NOTE
         * =====================================================
         */

        if (notes.length > 0) {
          setNote(notes[0]);
          return;
        }

        /*
         * =====================================================
         * CREATE INITIAL NOTE
         * =====================================================
         */

        const noteId = await NoteService.create({
          studentId: moduleData.studentId,

          title: moduleData.name,
          content: "",

          category: "Academic",

          subjectId: moduleData.subjectId || subjectId,

          moduleId: moduleData.id,

          moduleName: moduleData.name,

          tags: [],
          color: "#7C3AED",
          pinned: false,
          archived: false,
        });

        /*
         * =====================================================
         * FETCH THE CREATED NOTE
         * =====================================================
         */

        const createdNote = await NoteService.get(noteId);

        if (!createdNote) {
          throw new Error(
            "The note was created but could not be loaded."
          );
        }

        if (!cancelled) {
          setNote(createdNote);
        }
      } catch (error) {
        console.error("Failed to load notes page:", error);

        if (!cancelled) {
          setError("Failed to load notes. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNotesPage();

    return () => {
      cancelled = true;
    };
  }, [unitId, subjectId]);

  /*
   * ===========================================================
   * LOADING
   * ===========================================================
   */

  if (loading) {
    return (
      <div className="p-8">
        Loading notes...
      </div>
    );
  }

  /*
   * ===========================================================
   * ERROR
   * ===========================================================
   */

  if (error || !module || !note) {
    return (
      <div className="p-8">
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-zinc-900">
            Unable to load notes
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            {error ?? "The requested note could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  /*
   * ===========================================================
   * PAGE
   * ===========================================================
   */

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <NotesEditor note={note} />
        </div>

        <div>
          <AISidebar />
        </div>
      </div>
    </div>
  );
}