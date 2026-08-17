"use client";

import { useState } from "react";
import { CreateUnitData } from "@/types/unit";

const COLORS = [
  "#A78BFA",
  "#60A5FA",
  "#34D399",
  "#FBBF24",
  "#FB7185",
  "#F472B6",
];

interface Props {
  subjectId: string;
  studentId: string;
  onSubmit: (data: CreateUnitData) => Promise<void>;
}

export default function UnitForm({
  subjectId,
  studentId,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
      subjectId,
      studentId,
      title,
      description,
      progress: 0,
      color,
    });

    setTitle("");
    setDescription("");
    setColor(COLORS[0]);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card space-y-6 rounded-2xl p-6"
    >
      {/* Unit Title */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark">
          Unit Title
        </label>

        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Unit 1 - Introduction"
          className="w-full rounded-xl border border-line px-4 py-3"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark">
          Description
        </label>

        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this unit..."
          className="w-full rounded-xl border border-line px-4 py-3 resize-none"
        />
      </div>

      {/* Theme Color */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink-primary dark:text-ink-primary-dark">
          Theme Color
        </label>

        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full rounded-xl border border-line px-4 py-3"
        >
          {COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="btn-primary w-full justify-center"
      >
        Create Unit
      </button>
    </form>
  );
}