"use client";

interface Props {
  progress: number;
}

export default function StudyProgress({
  progress,
}: Props) {
  return (
    <div className="card rounded-2xl p-6">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-lg font-semibold">
            Study Progress
          </h2>

          <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
            Overall completion of this module
          </p>

        </div>

        <span className="text-2xl font-bold text-violet-600">
          {progress}%
        </span>

      </div>

      <div className="mt-6 h-4 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">

        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

      <div className="mt-4 flex justify-between text-sm text-ink-muted dark:text-ink-muted-dark">

        <span>Started</span>

        <span>Completed</span>

      </div>

    </div>
  );
}