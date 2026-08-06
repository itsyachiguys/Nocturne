"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Module } from "@/types/module";
import { ModuleService } from "@/services/module.service";

import NotesHeader from "@/components/notes/NotesHeader";
import NotesToolbar from "@/components/notes/NotesToolbar";
import NotesEditor from "@/components/notes/NotesEditor";
import AISidebar from "@/components/notes/AISidebar";

export default function NotesPage() {
  const params = useParams();

  const unitId = params.unitId as string;

  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModule() {
      try {
        const data = await ModuleService.get(unitId);
        setModule(data);
      } finally {
        setLoading(false);
      }
    }

    loadModule();
  }, [unitId]);

  if (loading) {
    return (
      <div className="p-8">
        Loading notes...
      </div>
    );
  }

  if (!module) {
    return (
      <div className="p-8">
        Module not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <NotesHeader title={module.name} />

      <NotesToolbar />

      <div className="grid gap-6 lg:grid-cols-4">

        <div className="lg:col-span-3">
        <NotesEditor
            studentId={module.studentId}
            subjectId={module.subjectId}
            moduleId={module.id}
        />
        </div>

        <div>
          <AISidebar />
        </div>

      </div>

    </div>
  );
}