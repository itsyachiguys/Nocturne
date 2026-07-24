"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import ModuleList from "@/components/modules/ModuleList";
import CreateModuleModal from "@/components/modules/CreateModuleModal";

import { Subject } from "@/types/subject";
import { Module } from "@/types/module";

import { SubjectService } from "@/services/subject.service";
import { ModuleService } from "@/services/module.service";

export default function SubjectPage() {
  const params = useParams();

  const subjectId = params.subjectId as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [modules, setModules] = useState<Module[]>([]);

  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function loadSubject() {
    const data = await SubjectService.get(subjectId);
    setSubject(data);
  }

  async function loadModules() {
    const data = await ModuleService.getBySubject(subjectId);
    setModules(data);
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        await Promise.all([
          loadSubject(),
          loadModules(),
        ]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="p-8">
        Subject not found.
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={subject.name}
        subtitle={subject.code}
      />

      <div className="grid gap-6">

        {/* Stats */}

        <div className="grid md:grid-cols-2 gap-4">

          <div className="card p-6">

            <p className="text-sm text-muted-foreground">
              Progress
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {subject.progress ?? 0}%
            </h2>

          </div>

          <div className="card p-6">

            <p className="text-sm text-muted-foreground">
              Attendance
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {subject.attendance ?? 0}%
            </h2>

          </div>

        </div>

        {/* Subject Information */}

        <div className="card p-6">

          <h2 className="text-lg font-semibold mb-5">
            Subject Information
          </h2>

          <div className="space-y-3">

            <p>
              <strong>Faculty:</strong>{" "}
              {subject.faculty}
            </p>

            <p>
              <strong>Semester:</strong>{" "}
              {subject.semester}
            </p>

            <p>
              <strong>Credits:</strong>{" "}
              {subject.credits}
            </p>

          </div>

        </div>

        {/* Modules */}

        <div className="card p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-lg font-semibold">
              Modules
            </h2>

            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + Add Module
            </button>

          </div>

          <ModuleList modules={modules} />

        </div>

      </div>

      {showCreateModal && (
        <CreateModuleModal
          subjectId={subjectId}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadModules}
        />
      )}
    </>
  );
}