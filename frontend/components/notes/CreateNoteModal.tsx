"use client";

import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase";

import { SubjectService } from "@/services/subject.service";
import { ModuleService } from "@/services/module.service";
import { NoteService } from "@/services/note.service";

import { Subject } from "@/types/subject";
import { Module } from "@/types/module";
import { NoteCategory } from "@/types/note";

interface Props {
  onClose: () => void;
  onCreated: () => Promise<void>;
}

export default function CreateNoteModal({
  onClose,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);

  const [title, setTitle] = useState("");

  const [category, setCategory] =
    useState<NoteCategory>("Academic");

  const [subjectId, setSubjectId] = useState("");

  const [moduleId, setModuleId] = useState("");

  useEffect(() => {
    async function loadSubjects() {
      if (!auth.currentUser) return;

      const data =
        await SubjectService.getByStudent(
          auth.currentUser.uid
        );

      setSubjects(data);
    }

    loadSubjects();
  }, []);

  useEffect(() => {
    async function loadModules() {
      if (!subjectId) {
        setModules([]);
        return;
      }

      const data =
        await ModuleService.getBySubject(
          subjectId
        );

      setModules(data);
    }

    loadModules();
  }, [subjectId]);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Please login again.");
      return;
    }

    if (!title.trim()) {
      return;
    }

    try {
      setLoading(true);

      await NoteService.create({
        studentId: auth.currentUser.uid,

        title,

        content: "",

        category,

        subjectId:
          category === "Academic"
            ? subjectId || undefined
            : undefined,

        moduleId:
          category === "Academic"
            ? moduleId || undefined
            : undefined,

        tags: [],

        pinned: false,

        archived: false,

        color: "#7C3AED",
      });

      await onCreated();

      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to create note.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl">

        <h2 className="mb-8 text-2xl font-bold">
          Create Note
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div>

            <label className="mb-2 block text-sm font-medium">
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value as NoteCategory
                )
              }
              className="w-full rounded-xl border px-4 py-3"
            >
              <option>Academic</option>
              <option>Personal</option>
              <option>Placement</option>
              <option>Research</option>
              <option>Other</option>
            </select>

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium">
              Title
            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Lecture 3 Notes"
              className="w-full rounded-xl border px-4 py-3"
            />

          </div>

          {category === "Academic" && (
            <>

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Subject
                </label>

                <select
                  value={subjectId}
                  onChange={(e) =>
                    setSubjectId(e.target.value)
                  }
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="">
                    Select Subject
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name}
                    </option>
                  ))}

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Module
                </label>

                <select
                  value={moduleId}
                  onChange={(e) =>
                    setModuleId(e.target.value)
                  }
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="">
                    Select Module
                  </option>

                  {modules.map((module) => (
                    <option
                      key={module.id}
                      value={module.id}
                    >
                      {module.name}
                    </option>
                  ))}

                </select>

              </div>

            </>
          )}

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-5 py-3"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white"
            >
              {loading
                ? "Creating..."
                : "Create Note"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}