"use client";

import Link from "next/link";
import { Module } from "@/types/module";

interface Props {
  module: Module;
}

export default function ModuleCard({
  module,
}: Props) {
  return (
    <Link href={`/dashboard/modules/${module.id}`}>
      <div className="border rounded-xl p-4 hover:shadow-lg hover:border-primary transition-all cursor-pointer">

        <div className="flex justify-between items-start">

          <div>

            <h3 className="text-lg font-semibold">
              {module.name}
            </h3>

            {module.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {module.description}
              </p>
            )}

          </div>

          <span className="font-semibold">
            {module.progress}%
          </span>

        </div>

        <div className="mt-4 h-2 rounded-full bg-gray-200 overflow-hidden">

          <div
            className="h-full rounded-full bg-purple-600 transition-all"
            style={{
              width: `${module.progress}%`,
            }}
          />

        </div>

      </div>
    </Link>
  );
}