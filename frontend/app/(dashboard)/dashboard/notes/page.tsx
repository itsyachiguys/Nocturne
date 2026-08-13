"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";

import { PageHeader } from "@/components/PageHeader";
import NoteList from "@/components/notes/NoteList";
import CreateNoteModal from "@/components/notes/CreateNoteModal";

import { Note, NoteCategory } from "@/types/note";
import { NoteService } from "@/services/note.service";

const categories: ("All" | NoteCategory)[] = [
  "All",
  "Academic",
  "Personal",
  "Placement",
  "Research",
  "Other",
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<"All" | NoteCategory>("All");

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

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesCategory =
        selectedCategory === "All" ||
        note.category === selectedCategory;

      const matchesSearch =
        note.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        note.content
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        note.tags.some((tag) =>
          tag.toLowerCase().includes(search.toLowerCase())
        );

      return (
        !note.archived &&
        matchesCategory &&
        matchesSearch
      );
    });
  }, [notes, search, selectedCategory]);

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
        subtitle="Organize your academic and personal notes"
      />

      <div className="space-y-6">

        <div className="grid gap-4 md:grid-cols-3">

          <div className="card p-6">
            <p className="text-sm text-zinc-500">
              Total Notes
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {notes.length}
            </h2>
          </div>

          <div className="card p-6">
            <p className="text-sm text-zinc-500">
              Pinned
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {notes.filter((n) => n.pinned).length}
            </h2>
          </div>

          <div className="card p-6">
            <p className="text-sm text-zinc-500">
              Archived
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {notes.filter((n) => n.archived).length}
            </h2>
          </div>

        </div>

        <div className="card p-6">

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex-1">

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search notes..."
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-violet-500"
              />

            </div>

            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              + New Note
            </button>

          </div>

          <div className="mb-6 flex flex-wrap gap-2">

            {categories.map((category) => (
              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(category)
                }
                className={`rounded-full px-4 py-2 text-sm transition ${
                  selectedCategory === category
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-100 hover:bg-zinc-200"
                }`}
              >
                {category}
              </button>
            ))}

          </div>

          <NoteList notes={filteredNotes} />

        </div>

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