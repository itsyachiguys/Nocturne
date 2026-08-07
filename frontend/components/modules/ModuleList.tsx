"use client";

import { Module } from "@/types/module";
import ModuleCard from "./ModuleCard";

interface Props {
  modules: Module[];
  onRefresh: () => Promise<void>;
}

export default function ModuleList({
  modules,
  onRefresh,
}: Props) {
  if (modules.length === 0) {
    return (
      <div className="py-10 text-center text-zinc-500">
        No modules created yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {modules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          onRefresh={onRefresh}
        />
      ))}

    </div>
  );
}