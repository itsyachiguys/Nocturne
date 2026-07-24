"use client";

import { useState } from "react";
import { NoteService } from "@/services/note.service";

interface Props {
  moduleId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateNoteModal({
  moduleId,
  onClose,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!title.trim()) return;

    setLoading(true);

    await NoteService.create({
      moduleId,
      title,
      content: "",
    });

    setLoading(false);

    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div className="card w-full max-w-lg p-6">

        <h2 className="text-xl font-semibold mb-6">
          Create Note
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>

            <label className="text-sm font-medium">
              Title
            </label>

            <input
              className="input mt-2"
              value={title}
              onChange={(e)=>
                setTitle(e.target.value)
              }
              placeholder="Introduction to Regression"
            />

          </div>

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
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