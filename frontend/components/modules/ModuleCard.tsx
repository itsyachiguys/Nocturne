"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Module } from "@/types/module";

import EditModuleModal from "./EditModuleModal";
import DeleteModuleDialog from "./DeleteModuleDialog";

interface Props {
  module: Module;
  onRefresh: () => Promise<void>;
}

export default function ModuleCard({
  module,
  onRefresh,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <div className="relative overflow-visible rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">

        {/* Header */}

        <div className="flex items-start justify-between">

          <Link
            href={`/dashboard/subjects/${module.subjectId}/units/${module.id}`}
            className="flex-1"
          >
            <h3 className="text-xl font-semibold">
              {module.name}
            </h3>

            {module.description && (
              <p className="mt-2 text-sm text-zinc-500">
                {module.description}
              </p>
            )}
          </Link>

          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="rounded-lg p-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <MoreVertical size={18} />
          </button>

        </div>

        {/* Progress */}

        <div className="mt-6">

          <div className="mb-2 flex justify-between text-sm">

            <span className="font-medium">
              Progress
            </span>

            <span className="font-semibold">
              {module.progress}%
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-zinc-200">

            <div
              className="h-full rounded-full bg-violet-600 transition-all duration-300"
              style={{
                width: `${module.progress}%`,
              }}
            />

          </div>

        </div>

        {/* Footer */}

        <div className="mt-5 flex justify-between text-sm text-zinc-500">

          <span>
            Module {module.order}
          </span>

          <span>
            Ready to Study
          </span>

        </div>

        {/* Menu */}

        {showMenu && (

          <div className="absolute right-5 top-14 z-40 w-52 rounded-xl border bg-white py-2 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">

            <button
              onClick={() => {
                setShowMenu(false);
                setShowEdit(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Pencil size={17} />
              Edit Module
            </button>

            <button
              onClick={() => {
                setShowMenu(false);
                setShowDelete(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 size={17} />
              Delete Module
            </button>

          </div>

        )}

      </div>

      {showEdit && (
        <EditModuleModal
          module={module}
          onClose={() => setShowEdit(false)}
          onUpdated={onRefresh}
        />
      )}

      {showDelete && (
        <DeleteModuleDialog
          module={module}
          onClose={() => setShowDelete(false)}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}