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

  const document = parser.parseFromString(
    html,
    "text/html"
  );

  return (document.body.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function NoteCard({ note }: Props) {
  const preview = getTextPreview(note.content);

  return (
    <Link
      href={`/dashboard/notes/${note.id}`}
      className="block"
    >
      <div
        className="
          group
          relative
          overflow-hidden
          rounded-2xl
          border
          border-zinc-200
          bg-white
          p-5
          shadow-sm
          transition-all
          duration-200
          hover:-translate-y-1
          hover:border-violet-300
          hover:shadow-xl
          dark:border-white/10
          dark:bg-[#211d38]
          dark:hover:border-violet-400/40
          dark:hover:bg-[#282242]
        "
      >

        {/* =====================================================
            COLOR INDICATOR
        ===================================================== */}

        <div
          className="absolute left-0 top-0 h-full w-1.5"
          style={{
            backgroundColor:
              note.color || "#7C3AED",
          }}
        />

        <div className="ml-3">

          {/* ===================================================
              HEADER
          =================================================== */}

          <div className="flex items-start justify-between gap-3">

            <h3
              className="
                line-clamp-2
                text-lg
                font-semibold
                text-zinc-900
                dark:text-white
              "
            >
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

          {/* ===================================================
              CONTENT PREVIEW
          =================================================== */}

          <p
            className="
              mt-4
              line-clamp-5
              min-h-[96px]
              text-sm
              leading-6
              text-zinc-600
              dark:text-zinc-300
            "
          >
            {preview || "No content yet..."}
          </p>

          {/* ===================================================
              CATEGORY + TAGS
          =================================================== */}

          <div className="mt-5 flex flex-wrap gap-2">

            <span
              className="
                rounded-full
                bg-violet-100
                px-3
                py-1
                text-xs
                font-medium
                text-violet-700
                dark:bg-violet-500/15
                dark:text-violet-300
              "
            >
              {note.category}
            </span>

            {note.tags?.map((tag) => (
              <span
                key={tag}
                className="
                  rounded-full
                  border
                  border-zinc-200
                  bg-zinc-100
                  px-3
                  py-1
                  text-xs
                  text-zinc-600
                  dark:border-white/10
                  dark:bg-white/[0.06]
                  dark:text-zinc-300
                "
              >
                #{tag}
              </span>
            ))}

          </div>

          {/* ===================================================
              FOOTER
          =================================================== */}

          <div
            className="
              mt-6
              flex
              items-center
              justify-between
              border-t
              border-zinc-200
              pt-4
              dark:border-white/10
            "
          >
            <span className="text-xs text-zinc-500 dark:text-zinc-500">
              {note.updatedAt
                ? "Recently updated"
                : "Just created"}
            </span>

            <span
              className="
                text-sm
                font-medium
                text-violet-600
                opacity-0
                transition-opacity
                duration-200
                group-hover:opacity-100
                dark:text-violet-300
              "
            >
              Open →
            </span>
          </div>

        </div>
      </div>
    </Link>
  );
}