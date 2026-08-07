"use client";

import { useState } from "react";

import { Module } from "@/types/module";
import { ModuleService } from "@/services/module.service";

interface Props {
  module: Module;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}

export default function DeleteModuleDialog({
  module,
  onClose,
  onDeleted,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    try {
      setLoading(true);

      await ModuleService.delete(module.id);

      await onDeleted();

      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to delete module.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl dark:bg-zinc-900">

        <h2 className="text-2xl font-bold text-red-600">
          Delete Module
        </h2>

        <p className="mt-4 text-zinc-600 dark:text-zinc-300">
          Are you sure you want to delete
          <span className="font-semibold">
            {" "}
            {module.name}
          </span>
          ?
        </p>

        <p className="mt-2 text-sm text-zinc-500">
          This action cannot be undone.
        </p>

        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-xl border px-5 py-3"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>

        </div>

      </div>

    </div>
  );
}