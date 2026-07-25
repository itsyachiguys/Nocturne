"use client";

import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";

import SubjectForm from "@/components/subjects/SubjectForm";
import { SubjectService } from "@/services/subject.service";
import { CreateSubjectData } from "@/types/subject";
import { PageHeader } from "@/components/PageHeader";

export default function NewSubjectPage() {
  const router = useRouter();

  const user = getAuth().currentUser;

  if (!user) {
    return <div>Loading...</div>;
  }

  const uid = user.uid;

  async function handleCreate(data: CreateSubjectData) {
    console.log("UID:", uid);
    console.log("Creating subject:", data);

    await SubjectService.create(data);

    router.push("/dashboard/subjects");
  }

  return (
    <>
      <PageHeader
        title="Create Subject"
        subtitle="Add a new subject to your workspace"
      />

      <div className="max-w-xl">
        <SubjectForm
          studentId={uid}
          onSubmit={handleCreate}
        />
      </div>
    </>
  );
}