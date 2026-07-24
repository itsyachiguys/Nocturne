"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth } from "firebase/auth";
import { IconPlus } from "@tabler/icons-react";

import { Subject } from "@/types/subject";
import { SubjectService } from "@/services/subject.service";
import SubjectCard from "@/components/subjects/SubjectCard";
import { PageHeader } from "@/components/PageHeader";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubjects() {
      const user = getAuth().currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await SubjectService.getAll(user.uid);
        setSubjects(data);
      } finally {
        setLoading(false);
      }
    }

    loadSubjects();
  }, []);

  if (loading) {
    return <p className="text-center py-10">Loading subjects...</p>;
  }

  return (
    <>
      <PageHeader
        title="Subjects"
        subtitle="Manage all your subjects"
      />

      <div className="mb-8 flex justify-end">
        <Link
          href="/dashboard/subjects/new"
          className="btn-primary flex items-center gap-2"
        >
          <IconPlus size={18} />
          New Subject
        </Link>
      </div>

      {subjects.length === 0 ? (
        <div className="card rounded-2xl p-10 text-center">
          <h2 className="text-xl font-semibold">
            No subjects yet
          </h2>

          <p className="mt-2 text-ink-secondary">
            Create your first subject to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
            />
          ))}
        </div>
      )}
    </>
  );
}