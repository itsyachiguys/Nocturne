"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

import { PageHeader } from "@/components/PageHeader";

import NoteList from "@/components/notes/NoteList";
import CreateNoteModal from "@/components/notes/CreateNoteModal";

import { Note } from "@/types/note";

import { NoteService } from "@/services/note.service";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function loadNotes() {
    if (!auth.currentUser) return;

    const data = await NoteService.getByStudent(
      auth.currentUser.uid
    );

    setNotes(data);
  }

  useEffect(() => {
    async function fetchNotes() {
      try {
        await loadNotes();
      } finally {
        setLoading(false);
      }
    }

    fetchNotes();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        Loading notes...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Notes"
        subtitle="Manage all your study notes"
      />

      <div className="card p-6">

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold">
              My Notes
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {notes.length} note{notes.length !== 1 ? "s" : ""}
            </p>

          </div>

          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            + New Note
          </button>

        </div>

        <NoteList notes={notes} />

      </div>

      {showModal && (
        <CreateNoteModal
          onClose={() => setShowModal(false)}
          onCreated={async () => {
            await loadNotes();
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}