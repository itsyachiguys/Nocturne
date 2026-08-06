"use client";

import { Module } from "@/types/module";

interface Props {
  module: Module;
}

export default function ModuleHeader({
  module,
}: Props) {
  return (
    <div className="card rounded-2xl p-8">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            {module.name}
          </h1>

          {module.description && (
            <p className="mt-3 text-ink-muted">
              {module.description}
            </p>
          )}

        </div>

        <div className="rounded-xl bg-violet-100 px-4 py-2 text-violet-700 font-semibold">
          Module {module.order}
        </div>

      </div>

    </div>
  );
}