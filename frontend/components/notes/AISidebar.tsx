"use client";

const tools = [
  "Generate Notes",
  "Summarize",
  "Explain Topic",
  "Generate Flashcards",
  "Generate Quiz",
];

export default function AISidebar() {
  return (
    <div className="card rounded-2xl p-6">

      <h2 className="mb-5 text-lg font-semibold">
        AI Assistant
      </h2>

      <div className="space-y-3">

        {tools.map((tool) => (

          <button
            key={tool}
            className="w-full rounded-xl border px-4 py-3 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {tool}
          </button>

        ))}

      </div>

    </div>
  );
}