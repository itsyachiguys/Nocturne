"use client";

interface Props {
  title: string;
}

export default function NotesHeader({
  title,
}: Props) {
  return (
    <div className="card rounded-2xl p-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            {title}
          </h1>

          <p className="mt-2 text-sm text-ink-muted">
            Your notes are automatically saved.
          </p>

        </div>

        <div className="text-right">

          <p className="text-sm font-medium text-green-600">
            Saved
          </p>

          <p className="text-xs text-ink-muted">
            Last updated just now
          </p>

        </div>

      </div>

    </div>
  );
}