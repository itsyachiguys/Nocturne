"use client";

import { Module } from "@/types/module";

interface Props {
  module: Module;
}

export default function ModuleStats({
  module,
}: Props) {
  return (
    <div className="grid gap-5 md:grid-cols-4">

      {/* Progress */}

      <div className="card rounded-2xl p-6">

        <p className="text-sm text-ink-muted">
          Progress
        </p>

        <h2 className="mt-2 text-3xl font-bold text-violet-600">
          {module.progress}%
        </h2>

      </div>

      {/* Order */}

      <div className="card rounded-2xl p-6">

        <p className="text-sm text-ink-muted">
          Module Order
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {module.order}
        </h2>

      </div>

      {/* Status */}

      <div className="card rounded-2xl p-6">

        <p className="text-sm text-ink-muted">
          Status
        </p>

        <h2 className="mt-2 text-xl font-semibold text-green-600">
          Active
        </h2>

      </div>

      {/* Updated */}

      <div className="card rounded-2xl p-6">

        <p className="text-sm text-ink-muted">
          Last Updated
        </p>

        <h2 className="mt-2 text-lg font-semibold">
          Recently
        </h2>

      </div>

    </div>
  );
}