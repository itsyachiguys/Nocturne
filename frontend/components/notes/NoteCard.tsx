"use client";

import Link from "next/link";
import { Note } from "@/types/note";

interface Props {
  note: Note;
}

function getTextPreview(html: string): string {
  if (!html || !html.trim()) {
    return "";
  }

  if (typeof window === "undefined") {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  return (document.body.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function NoteCard({
  note,
}: Props) {
  const preview = getTextPreview(note.content);

  return (
    <Link href={`/dashboard/notes/${note.id}`}>
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-violet-400 hover:shadow-xl">

        {/* Color indicator */}

        <div
          className="absolute left-0 top-0 h-full w-2"
          style={{
            backgroundColor: note.color || "#7C3AED",
          }}
        />

        <div className="ml-3">

          {/* Header */}

          <div className="flex items-start justify-between gap-3">

            <h3 className="line-clamp-2 text-lg font-semibold text-zinc-900">
              {note.title || "Untitled Note"}
            </h3>

            {note.pinned && (
              <span
                title="Pinned"
                className="shrink-0 text-lg"
              >
                📌
              </span>
            )}

          </div>

          {/* Content preview */}

          <p className="mt-4 line-clamp-5 min-h-[96px] text-sm leading-6 text-zinc-600">
            {preview || "No content yet..."}
          </p>

          {/* Category + Tags */}

          <div className="mt-5 flex flex-wrap gap-2">

            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
              {note.category}
            </span>

            {note.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600"
              >
                #{tag}
              </span>
            ))}

          </div>

          {/* Footer */}

          <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-4">

            <span className="text-xs text-zinc-500">
              {note.updatedAt
                ? "Recently updated"
                : "Just created"}
            </span>

            <span className="text-sm font-medium text-violet-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Open →
            </span>

          </div>

        </div>

      </div>
    </Link>
  );
}