"use client";

import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";

import NoteList from "@/components/notes/NoteList";
import CreateNoteModal from "@/components/notes/CreateNoteModal";

import { Note } from "@/types/note";

export default function NotesPage() {

  const [notes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Notes"
        subtitle="Manage your study notes"
      />

      <div className="card p-6">

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-xl font-semibold">
            Notes
          </h2>

          <button
            className="btn-primary"
            onClick={() =>
              setShowModal(true)
            }
          >
            + New Note
          </button>

        </div>

        <NoteList notes={notes} />

      </div>

      {showModal && (
        <CreateNoteModal
          moduleId=""
          onClose={() =>
            setShowModal(false)
          }
          onCreated={() => {}}
        />
      )}

    </>
  );
}