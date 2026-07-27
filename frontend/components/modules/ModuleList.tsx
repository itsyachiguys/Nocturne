"use client";

import { Module } from "@/types/module";
import ModuleCard from "./ModuleCard";

interface Props {
  modules: Module[];
}

export default function ModuleList({
  modules,
}: Props) {

  if (modules.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No modules created yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {modules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
        />
      ))}

    </div>
  );
}