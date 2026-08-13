"use client";

import { Editor } from "@tiptap/react";

interface Props {
  editor: Editor | null;
}

export default function EditorToolbar({
  editor,
}: Props) {
  if (!editor) return null;

  const button =
    "rounded-lg border border-zinc-200 px-3 py-2 text-sm transition hover:bg-violet-50";

  const active =
    "bg-violet-600 text-white border-violet-600";

  return (
    <div className="sticky top-0 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3 shadow-sm">

      {/* Undo / Redo */}

      <button
        type="button"
        className={button}
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↶
      </button>

      <button
        type="button"
        className={button}
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↷
      </button>

      <div className="mx-2 h-8 w-px bg-zinc-300" />

      {/* Bold */}

      <button
        type="button"
        className={`${button} ${
          editor.isActive("bold") ? active : ""
        }`}
        onClick={() =>
          editor.chain().focus().toggleBold().run()
        }
      >
        <b>B</b>
      </button>

      {/* Italic */}

      <button
        type="button"
        className={`${button} ${
          editor.isActive("italic") ? active : ""
        }`}
        onClick={() =>
          editor.chain().focus().toggleItalic().run()
        }
      >
        <i>I</i>
      </button>

      {/* Underline */}

      <button
        type="button"
        className={`${button} ${
          editor.isActive("underline") ? active : ""
        }`}
        onClick={() =>
          editor.chain().focus().toggleUnderline().run()
        }
      >
        <u>U</u>
      </button>

      {/* Strike */}

      <button
        type="button"
        className={`${button} ${
          editor.isActive("strike") ? active : ""
        }`}
        onClick={() =>
          editor.chain().focus().toggleStrike().run()
        }
      >
        <s>S</s>
      </button>

      <div className="mx-2 h-8 w-px bg-zinc-300" />

      {/* Headings */}

      {[1, 2, 3].map((level) => (
        <button
          key={level}
          type="button"
          className={`${button} ${
            editor.isActive("heading", { level })
              ? active
              : ""
          }`}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: level as 1 | 2 | 3,
              })
              .run()
          }
        >
          H{level}
        </button>
      ))}

      <div className="mx-2 h-8 w-px bg-zinc-300" />

      {/* Bullet List */}

      <button
        type="button"
        className={`${button} ${
          editor.isActive("bulletList")
            ? active
            : ""
        }`}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleBulletList()
            .run()
        }
      >
        • List
      </button>

      {/* Ordered List */}

      <button
        type="button"
        className={`${button} ${
          editor.isActive("orderedList")
            ? active
            : ""
        }`}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleOrderedList()
            .run()
        }
      >
        1. List
      </button>

      {/* Task List */}

      <button
        type="button"
        className={`${button} ${
          editor.isActive("taskList")
            ? active
            : ""
        }`}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleTaskList()
            .run()
        }
      >
        ☑
      </button>

      <div className="mx-2 h-8 w-px bg-zinc-300" />

      {/* Alignment */}

      <button
        type="button"
        className={`${button} ${
          editor.isActive({ textAlign: "left" })
            ? active
            : ""
        }`}
        onClick={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
      >
        ⬅
      </button>

      <button
        type="button"
        className={`${button} ${
          editor.isActive({ textAlign: "center" })
            ? active
            : ""
        }`}
        onClick={() =>
          editor
            .chain()
            .focus()
            .setTextAlign("center")
            .run()
        }
      >
        ⬌
      </button>

      <button
        type="button"
        className={`${button} ${
          editor.isActive({ textAlign: "right" })
            ? active
            : ""
        }`}
        onClick={() =>
          editor
            .chain()
            .focus()
            .setTextAlign("right")
            .run()
        }
      >
        ➡
      </button>

    </div>
  );
}