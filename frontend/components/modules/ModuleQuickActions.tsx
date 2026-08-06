"use client";

import Link from "next/link";

interface Props {
  subjectId: string;
  moduleId: string;
}

const actions = [
  {
    title: "Notes",
    icon: "📄",
    description: "Read and edit study notes",
    route: "notes",
  },
  {
    title: "Files",
    icon: "📚",
    description: "Upload PDFs & resources",
    route: "files",
  },
  {
    title: "AI Summary",
    icon: "🤖",
    description: "Generate AI explanations",
    route: "summary",
  },
  {
    title: "Flashcards",
    icon: "📝",
    description: "Practice with flashcards",
    route: "flashcards",
  },
  {
    title: "Quizzes",
    icon: "❓",
    description: "Test your knowledge",
    route: "quizzes",
  },
  {
    title: "Analytics",
    icon: "📊",
    description: "View study progress",
    route: "analytics",
  },
];

export default function ModuleQuickActions({
  subjectId,
  moduleId,
}: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

      {actions.map((action) => (

        <Link
          key={action.route}
          href={`/dashboard/subjects/${subjectId}/units/${moduleId}/${action.route}`}
          className="card rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
        >

          <div className="text-4xl">
            {action.icon}
          </div>

          <h3 className="mt-5 text-lg font-semibold">
            {action.title}
          </h3>

          <p className="mt-2 text-sm text-ink-muted">
            {action.description}
          </p>

        </Link>

      ))}

    </div>
  );
}