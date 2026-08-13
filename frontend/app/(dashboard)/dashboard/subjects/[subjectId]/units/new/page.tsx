"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { auth } from "@/lib/firebase";
import { ModuleService } from "@/services/module.service";

export default function NewUnitPage() {
  const params = useParams();
  const router = useRouter();

  const subjectId = params.subjectId as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(1);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    const user = auth.currentUser;

    if (!user) {
      setError("You must be logged in to create a unit.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a unit name.");
      return;
    }

    if (!subjectId) {
      setError("Subject ID is missing.");
      return;
    }

    try {
      setSaving(true);

      await ModuleService.create({
        studentId: user.uid,
        subjectId,
        name: name.trim(),
        description: description.trim() || undefined,
        order,
      });

      router.push(
        `/dashboard/subjects/${subjectId}`
      );
    } catch (err) {
      console.error("Failed to create unit:", err);

      setError(
        "Failed to create the unit. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-zinc-900">
          Create New Unit
        </h1>

        <p className="mt-2 text-zinc-500">
          Add a new unit or module to this subject.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card space-y-6 p-8"
      >

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Unit Name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="e.g. Introduction to Data Structures"
            disabled={saving}
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Description
            <span className="ml-2 font-normal text-zinc-400">
              Optional
            </span>
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Briefly describe what this unit covers..."
            rows={4}
            disabled={saving}
            className="w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="order"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Unit Order
          </label>

          <input
            id="order"
            type="number"
            min={1}
            value={order}
            onChange={(e) =>
              setOrder(
                Math.max(
                  1,
                  Number(e.target.value) || 1
                )
              )
            }
            disabled={saving}
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-zinc-100"
          />

          <p className="mt-2 text-xs text-zinc-500">
            Determines the position of this unit within
            the subject.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/subjects/${subjectId}`
              )
            }
            disabled={saving}
            className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Creating..."
              : "Create Unit"}
          </button>

        </div>

      </form>
    </div>
  );
}