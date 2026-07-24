"use client";

import Link from "next/link";
import { Subject } from "@/types/subject";
import {
  IconSchool,
  IconBook2,
  IconUser,
} from "@tabler/icons-react";

interface Props {
  subject: Subject;
}

export default function SubjectCard({
  subject,
}: Props) {
  return (
    <Link href={`/dashboard/subjects/${subject.id}`}>
      <div className="card hover:shadow-lg transition-all duration-300 cursor-pointer p-6 rounded-2xl">

        <div className="flex items-center gap-3 mb-5">

          <div
            className="w-5 h-5 rounded-full"
            style={{
              background: subject.color,
            }}
          />

          <div>
            <h3 className="font-semibold text-lg">
              {subject.name}
            </h3>

            <p className="text-sm text-gray-500">
              {subject.code}
            </p>
          </div>

        </div>

        <div className="space-y-2 text-sm">

          <div className="flex items-center gap-2">
            <IconUser size={16} />
            {subject.faculty}
          </div>

          <div className="flex items-center gap-2">
            <IconSchool size={16} />
            Semester {subject.semester}
          </div>

          <div className="flex items-center gap-2">
            <IconBook2 size={16} />
            {subject.credits} Credits
          </div>

        </div>

        <div className="mt-6">

          <div className="flex justify-between text-xs mb-2">
            <span>Progress</span>
            <span>{subject.progress ?? 0}%</span>
          </div>

          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">

            <div
              className="h-full rounded-full"
              style={{
                width: `${subject.progress ?? 0}%`,
                background: subject.color,
              }}
            />

          </div>

        </div>

      </div>
    </Link>
  );
}