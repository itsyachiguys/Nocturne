"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { IconEdit, IconX } from "@tabler/icons-react";

import { PageHeader } from "@/components/PageHeader";
import ModuleList from "@/components/modules/ModuleList";
import CreateModuleModal from "@/components/modules/CreateModuleModal";
import SubjectForm from "@/components/subjects/SubjectForm";

import { Subject } from "@/types/subject";
import { Module } from "@/types/module";

import { SubjectService } from "@/services/subject.service";
import { ModuleService } from "@/services/module.service";

import { useAuth } from "@/context/AuthContext";

export default function SubjectPage() {
  const params = useParams();

  const subjectId = params.subjectId as string;

  const { user, loading: authLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [modules, setModules] = useState<Module[]>([]);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] =
    useState(false);

  async function loadSubject() {
    const data = await SubjectService.get(subjectId);
    setSubject(data);
  }

  async function loadModules() {
    const data =
      await ModuleService.getBySubject(subjectId);

    setModules(data);
  }

  async function load() {
    setLoading(true);

    try {
      await Promise.all([
        loadSubject(),
        loadModules(),
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      load();
    }
  }, [subjectId, authLoading, user]);

  async function handleUpdate(
    data: Parameters<
      typeof SubjectService.update
    >[1]
  ) {
    if (!subject) return;

    await SubjectService.update(
      subject.id,
      data
    );

    await loadSubject();

    setEditing(false);
  }

  if (authLoading || loading) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <div className="card p-8">
          Please log in to view this subject.
        </div>
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

  /*
   * ============================================================
   * EDIT MODE
   * ============================================================
   */

  if (editing) {
    return (
      <>
        <PageHeader
          title={`Edit ${subject.name}`}
          subtitle="Update your subject information"
        />

        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium transition hover:bg-surface-alt dark:hover:bg-surface-alt-dark"
          >
            <IconX size={17} />
            Cancel
          </button>
        </div>

        <div className="max-w-xl">
          <SubjectForm
            studentId={subject.studentId}
            initialData={subject}
            submitLabel="Save Changes"
            onSubmit={handleUpdate}
          />
        </div>
      </>
    );
  }

  /*
   * ============================================================
   * NORMAL SUBJECT VIEW
   * ============================================================
   */

  return (
    <>
      <PageHeader
        title={subject.name}
        subtitle={subject.code}
      />

      {/* Edit button */}
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn-primary flex items-center gap-2"
        >
          <IconEdit size={17} />
          Edit Subject
        </button>
      </div>

      <div className="grid gap-6">

        {/* Progress + Attendance */}
        <div className="grid gap-4 md:grid-cols-2">

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

          <div className="mb-5 flex items-center justify-between">

            <h2 className="text-lg font-semibold">
              Subject Information
            </h2>

            <div
              className="h-5 w-5 rounded-full border border-black/10"
              style={{
                backgroundColor: subject.color,
              }}
              title="Subject theme color"
            />

          </div>

          <div className="space-y-3">

            <p>
              <strong>Faculty:</strong>{" "}
              {subject.faculty || "Not specified"}
            </p>

            <p>
              <strong>Semester:</strong>{" "}
              {subject.semester}
            </p>

            <p>
              <strong>Credits:</strong>{" "}
              {subject.credits}
            </p>

            <p>
              <strong>Subject Code:</strong>{" "}
              {subject.code}
            </p>

          </div>

        </div>

        {/* Modules */}
        <div className="card p-6">

          <div className="mb-6 flex items-center justify-between">

            <h2 className="text-lg font-semibold">
              Modules
            </h2>

            <button
              onClick={() =>
                setShowCreateModal(true)
              }
              className="btn-primary"
            >
              + Add Module
            </button>

          </div>

          <ModuleList
            modules={modules}
            onRefresh={loadModules}
          />

        </div>

      </div>

      {/* Create Module */}
      {showCreateModal && (
        <CreateModuleModal
          subjectId={subject.id}
          studentId={subject.studentId}
          onClose={() =>
            setShowCreateModal(false)
          }
          onCreated={async () => {
            await loadModules();
            setShowCreateModal(false);
          }}
        />
      )}
    </>
  );
}