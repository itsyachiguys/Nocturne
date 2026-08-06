"use client";

export default function NotesToolbar() {
  const actions = [
    "Bold",
    "Italic",
    "Heading",
    "List",
    "Quote",
    "Code",
    "Export",
  ];

  return (
    <div className="card rounded-2xl p-4">

      <div className="flex flex-wrap gap-3">

        {actions.map((action) => (

          <button
            key={action}
            type="button"
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {action}
          </button>

        ))}

      </div>

    </div>
  );
}