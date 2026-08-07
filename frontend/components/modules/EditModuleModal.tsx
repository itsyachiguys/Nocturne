"use client";

import { useState } from "react";

import { Module } from "@/types/module";
import { ModuleService } from "@/services/module.service";

interface Props {
  module: Module;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditModuleModal({
  module,
  onClose,
  onUpdated,
}: Props) {
  const [name, setName] = useState(module.name);
  const [description, setDescription] = useState(
    module.description ?? ""
  );
  const [order, setOrder] = useState(module.order);

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      setLoading(true);

      await ModuleService.update(module.id, {
        name,
        description,
        order,
      });

      await onUpdated();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to update module.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl dark:bg-zinc-900">

        <h2 className="mb-8 text-2xl font-bold">
          Edit Module
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div>

            <label className="mb-2 block text-sm font-medium">
              Module Name
            </label>

            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-violet-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              rows={4}
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-violet-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium">
              Module Order
            </label>

            <input
              type="number"
              min={1}
              value={order}
              onChange={(e) =>
                setOrder(Number(e.target.value))
              }
              className="w-32 rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-violet-500"
            />

          </div>

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
              className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}