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
    const normalizedSearch = search.toLowerCase();

    return notes.filter((note) => {
      const matchesCategory =
        selectedCategory === "All" ||
        note.category === selectedCategory;

      const matchesSearch =
        note.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        note.content
          .toLowerCase()
          .includes(normalizedSearch) ||
        note.tags.some((tag) =>
          tag.toLowerCase().includes(normalizedSearch)
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
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading notes...
        </p>
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

        {/* =====================================================
            NOTE STATISTICS
        ===================================================== */}

        <div className="grid gap-4 md:grid-cols-3">

          <div className="card p-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Total Notes
            </p>

            <h2 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
              {notes.length}
            </h2>
          </div>

          <div className="card p-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Pinned
            </p>

            <h2 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
              {notes.filter((n) => n.pinned).length}
            </h2>
          </div>

          <div className="card p-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Archived
            </p>

            <h2 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
              {notes.filter((n) => n.archived).length}
            </h2>
          </div>

        </div>

        {/* =====================================================
            NOTES CONTAINER
        ===================================================== */}

        <div className="card p-6">

          {/* ===================================================
              SEARCH + CREATE
          =================================================== */}

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex-1">

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search notes..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-zinc-300
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-zinc-900
                  outline-none
                  placeholder:text-zinc-400
                  transition
                  focus:border-violet-500
                  dark:border-white/20
                  dark:bg-white/10
                  dark:text-white
                  dark:placeholder:text-zinc-400
                "
              />

            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              + New Note
            </button>

          </div>

          {/* ===================================================
              CATEGORY FILTERS
          =================================================== */}

          <div className="mb-6 flex flex-wrap gap-2">

            {categories.map((category) => {
              const isActive =
                selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                  className={`
                    rounded-full
                    border
                    px-4
                    py-2
                    text-sm
                    font-medium
                    transition-all
                    duration-150
                    ${
                      isActive
                        ? "border-violet-600 bg-violet-600 text-white hover:bg-violet-700"
                        : "border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15 dark:hover:text-white"
                    }
                  `}
                >
                  {category}
                </button>
              );
            })}

          </div>

          {/* ===================================================
              NOTES
          =================================================== */}

          <NoteList notes={filteredNotes} />

        </div>

      </div>

      {/* =======================================================
          CREATE NOTE MODAL
      ======================================================= */}

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