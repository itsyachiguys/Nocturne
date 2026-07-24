"use client";

import { useState } from "react";

import { ModuleService } from "@/services/module.service";

interface Props {
  subjectId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateModuleModal({
  subjectId,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(1);

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!name.trim()) return;

    setLoading(true);

    await ModuleService.create({
      subjectId,
      name,
      description,
      order,
    });

    setLoading(false);

    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg p-6">

        <h2 className="text-xl font-bold mb-6">
          Create Module
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>

            <label className="text-sm">
              Module Name
            </label>

            <input
              className="input mt-1"
              value={name}
              onChange={(e)=>
                setName(e.target.value)
              }
              required
            />

          </div>

          <div>

            <label className="text-sm">
              Description
            </label>

            <textarea
              className="input mt-1"
              rows={3}
              value={description}
              onChange={(e)=>
                setDescription(e.target.value)
              }
            />

          </div>

          <div>

            <label className="text-sm">
              Order
            </label>

            <input
              type="number"
              className="input mt-1"
              value={order}
              onChange={(e)=>
                setOrder(Number(e.target.value))
              }
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
                : "Create Module"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}