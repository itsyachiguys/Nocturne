"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { auth } from "@/lib/firebase";
import { Module } from "@/types/module";
import { ModuleService } from "@/services/module.service";

export default function UnitsPage() {
  const params = useParams();

  const subjectId = params.subjectId as string;

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadModules() {
    if (!subjectId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await ModuleService.getBySubject(subjectId);

      setModules(data);
    } catch (err) {
      console.error("Failed to load units:", err);
      setError("Failed to load units.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModules();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-zinc-500">
          Loading units...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            Units
          </h1>

          <p className="mt-2 text-zinc-500">
            Organize this subject into units and modules.
          </p>
        </div>

        <Link
          href={`/dashboard/subjects/${subjectId}/units/new`}
          className="btn-primary inline-flex items-center justify-center"
        >
          + New Unit
        </Link>

      </div>

      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Empty state */}

      {!error && modules.length === 0 && (
        <div className="card flex flex-col items-center justify-center p-12 text-center">

          <div className="mb-4 text-5xl">
            📚
          </div>

          <h2 className="text-xl font-semibold text-zinc-900">
            No units yet
          </h2>

          <p className="mt-2 max-w-md text-sm text-zinc-500">
            Start organizing this subject by creating
            your first unit.
          </p>

          <Link
            href={`/dashboard/subjects/${subjectId}/units/new`}
            className="btn-primary mt-6"
          >
            Create First Unit
          </Link>

        </div>
      )}

      {/* Units */}

      {modules.length > 0 && (
        <div className="space-y-4">

          {modules.map((module, index) => (
            <Link
              key={module.id}
              href={`/dashboard/subjects/${subjectId}/units/${module.id}`}
              className="block"
            >
              <div className="card group p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-lg">

                <div className="flex items-start gap-5">

                  {/* Order */}

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg font-bold text-violet-700">
                    {module.order || index + 1}
                  </div>

                  {/* Content */}

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-violet-600">
                          {module.name}
                        </h2>

                        {module.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                            {module.description}
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-violet-600">
                        →
                      </span>

                    </div>

                    {/* Progress */}

                    <div className="mt-5">

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-xs font-medium text-zinc-500">
                          Progress
                        </span>

                        <span className="text-xs font-semibold text-zinc-700">
                          {module.progress ?? 0}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">

                        <div
                          className="h-full rounded-full bg-violet-600 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                module.progress ?? 0
                              )
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                  </div>

                </div>

              </div>
            </Link>
          ))}

        </div>
      )}

    </div>
  );
}