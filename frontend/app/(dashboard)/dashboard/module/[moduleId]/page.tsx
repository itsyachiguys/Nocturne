"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Module } from "@/types/module";
import { ModuleService } from "@/services/module.service";

import { PageHeader } from "@/components/PageHeader";

export default function ModulePage() {
  const params = useParams();

  const moduleId = params.moduleId as string;

  const [module, setModule] =
    useState<Module | null>(null);

  useEffect(() => {
    async function load() {
      const data = await ModuleService.get(moduleId);
      setModule(data);
    }

    load();
  }, [moduleId]);

  if (!module) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <PageHeader
        title={module.name}
        subtitle={module.description ?? ""}
      />

      <div className="grid gap-6">

        {/* Progress */}

        <div className="card p-6">

          <div className="flex justify-between">

            <span className="font-medium">
              Progress
            </span>

            <span>
              {module.progress}%
            </span>

          </div>

          <div className="mt-4 h-2 rounded-full bg-gray-200">

            <div
              className="h-full rounded-full bg-purple-600"
              style={{
                width: `${module.progress}%`,
              }}
            />

          </div>

        </div>

        {/* Quick Actions */}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

          <button className="card p-6 hover:shadow transition text-left">
            📄 Notes
          </button>

          <button className="card p-6 hover:shadow transition text-left">
            📚 PDFs
          </button>

          <button className="card p-6 hover:shadow transition text-left">
            🤖 AI Summary
          </button>

          <button className="card p-6 hover:shadow transition text-left">
            📝 Flashcards
          </button>

          <button className="card p-6 hover:shadow transition text-left">
            ❓ Quizzes
          </button>

          <button className="card p-6 hover:shadow transition text-left">
            📊 Analytics
          </button>

        </div>

      </div>
    </>
  );
}