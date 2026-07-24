import Link from "next/link";

const actions = [
  {
    title: "Notes",
    href: "#",
    emoji: "📄",
  },
  {
    title: "PDFs",
    href: "#",
    emoji: "📚",
  },
  {
    title: "AI Summary",
    href: "#",
    emoji: "🤖",
  },
  {
    title: "Flashcards",
    href: "#",
    emoji: "📝",
  },
  {
    title: "Quizzes",
    href: "#",
    emoji: "❓",
  },
  {
    title: "Analytics",
    href: "#",
    emoji: "📊",
  },
];

export default function ModuleActions() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

      {actions.map((action) => (

        <Link
          key={action.title}
          href={action.href}
          className="card p-6 hover:shadow-lg transition"
        >

          <div className="text-3xl">
            {action.emoji}
          </div>

          <h3 className="mt-4 font-semibold">
            {action.title}
          </h3>

        </Link>

      ))}

    </div>
  );
}