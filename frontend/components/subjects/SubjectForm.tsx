"use client";

import { useState } from "react";
import { CreateSubjectData } from "@/types/subject";

const COLORS = [
  "#A78BFA",
  "#60A5FA",
  "#34D399",
  "#FBBF24",
  "#FB7185",
  "#F472B6",
];

interface Props {
  onSubmit: (data: CreateSubjectData) => Promise<void>;
  studentId: string;
}

export default function SubjectForm({
  onSubmit,
  studentId,
}: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState(1);
  const [credits, setCredits] = useState(4);
  const [faculty, setFaculty] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
      studentId,
      name,
      code,
      semester,
      credits,
      faculty,
      color,
    });

    setName("");
    setCode("");
    setSemester(1);
    setCredits(4);
    setFaculty("");
    setColor(COLORS[0]);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card space-y-6 rounded-2xl p-6"
    >
      {/* Subject Name */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink-primary">
          Subject Name
        </label>

        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Machine Learning"
          className="w-full rounded-xl border border-line px-4 py-3"
        />
      </div>

      {/* Subject Code */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink-primary">
          Subject Code
        </label>

        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. CE0567"
          className="w-full rounded-xl border border-line px-4 py-3"
        />
      </div>

      {/* Semester + Credits */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink-primary">
            Semester
          </label>

          <input
            type="number"
            min={1}
            max={8}
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="w-full rounded-xl border border-line px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink-primary">
            Credits
          </label>

          <input
            type="number"
            min={1}
            max={10}
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value))}
            className="w-full rounded-xl border border-line px-4 py-3"
          />
        </div>
      </div>

      {/* Faculty */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink-primary">
          Faculty
        </label>

        <input
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          placeholder="e.g. Dr. John Smith"
          className="w-full rounded-xl border border-line px-4 py-3"
        />
      </div>

      {/* Color */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink-primary">
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
        Create Subject
      </button>
    </form>
  );
}