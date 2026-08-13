"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  EditorContent,
  useEditor,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

import { Note } from "@/types/note";
import { Subject } from "@/types/subject";
import { Module } from "@/types/module";

import { NoteService } from "@/services/note.service";
import { SubjectService } from "@/services/subject.service";
import { ModuleService } from "@/services/module.service";

interface Props {
  note: Note;
}

export default function NotesEditor({ note }: Props) {
  const router = useRouter();

  /*
   * =========================================================
   * BASIC STATE
   * =========================================================
   */

  const [title, setTitle] = useState(note.title);
  const [status, setStatus] = useState("Saved");

  const [pinned, setPinned] = useState(note.pinned);
  const [archived, setArchived] = useState(note.archived);

  const [subject, setSubject] =
    useState<Subject | null>(null);

  const [module, setModule] =
    useState<Module | null>(null);

  /*
   * =========================================================
   * AUTOSAVE REFS
   *
   * Refs prevent TipTap's onUpdate callback from using
   * stale title/content values.
   * =========================================================
   */

  const titleRef = useRef(note.title);
  const contentRef = useRef(note.content || "");

  const timeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const savingRef = useRef(false);

  /*
   * =========================================================
   * SAVE NOTE
   * =========================================================
   */

  async function saveNote(
    newTitle: string,
    newContent: string
  ) {
    if (savingRef.current) {
      return;
    }

    savingRef.current = true;

    setStatus("Saving...");

    try {
      await NoteService.update(note.id, {
        title: newTitle,
        content: newContent,
      });

      setStatus("Saved");
    } catch (error) {
      console.error(
        "Failed to save note:",
        error
      );

      setStatus("Failed to save");
    } finally {
      savingRef.current = false;
    }
  }

  /*
   * =========================================================
   * DEBOUNCED AUTOSAVE
   * =========================================================
   */

  function scheduleSave(
    newTitle: string,
    newContent: string
  ) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus("Unsaved");

    timeoutRef.current = setTimeout(() => {
      saveNote(
        newTitle,
        newContent
      );
    }, 1000);
  }

  /*
   * =========================================================
   * TIPTAP EDITOR
   * =========================================================
   *
   * StarterKit already provides:
   *
   * - Paragraph
   * - Headings
   * - Bold
   * - Italic
   * - Strike
   * - Underline
   * - Bullet lists
   * - Ordered lists
   * - Blockquotes
   * - Code blocks
   * - Horizontal rule
   * - Undo / Redo
   *
   * Additional extensions:
   *
   * - Link
   * - Highlight
   * - Text alignment
   * - Task lists
   * - Tables
   */

  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        /*
         * StarterKit v3 already contains Link.
         *
         * We disable the built-in version because we want
         * our own configured Link extension below.
         */
        link: false,
      }),

      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",

        HTMLAttributes: {
          class:
            "text-violet-600 underline underline-offset-2",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),

      Highlight.configure({
        multicolor: true,
      }),

      TextAlign.configure({
        types: [
          "heading",
          "paragraph",
        ],
      }),

      TaskList.configure({
        HTMLAttributes: {
          class: "not-prose",
        },
      }),

      TaskItem.configure({
        nested: true,
      }),

      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class:
            "w-full border-collapse my-6",
        },
      }),

      TableRow,

      TableHeader,

      TableCell,
    ],

    content: note.content || "",

    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      contentRef.current = html;

      scheduleSave(
        titleRef.current,
        html
      );
    },
  });

  /*
   * =========================================================
   * LOAD SUBJECT + MODULE
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        if (note.subjectId) {
          const subjectData =
            await SubjectService.get(
              note.subjectId
            );

          if (!cancelled) {
            setSubject(subjectData);
          }
        } else {
          setSubject(null);
        }

        if (note.moduleId) {
          const moduleData =
            await ModuleService.get(
              note.moduleId
            );

          if (!cancelled) {
            setModule(moduleData);
          }
        } else {
          setModule(null);
        }
      } catch (error) {
        console.error(
          "Failed to load note context:",
          error
        );
      }
    }

    loadContext();

    return () => {
      cancelled = true;
    };
  }, [
    note.subjectId,
    note.moduleId,
  ]);

  /*
   * =========================================================
   * SYNC NOTE WHEN ROUTE/NOTE CHANGES
   * =========================================================
   */

  useEffect(() => {
    if (!editor) {
      return;
    }

    const incomingContent =
      note.content || "";

    const currentContent =
      editor.getHTML();

    if (
      currentContent !==
      incomingContent
    ) {
      editor.commands.setContent(
        incomingContent,
        {
          emitUpdate: false,
        }
      );
    }

    setTitle(note.title);
    setPinned(note.pinned);
    setArchived(note.archived);

    titleRef.current = note.title;
    contentRef.current =
      incomingContent;
  }, [editor, note]);

  /*
   * =========================================================
   * CLEANUP
   * =========================================================
   */

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(
          timeoutRef.current
        );
      }
    };
  }, []);

  /*
   * =========================================================
   * TITLE CHANGE
   * =========================================================
   */

  function handleTitleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const value =
      e.target.value;

    setTitle(value);

    titleRef.current = value;

    scheduleSave(
      value,
      contentRef.current
    );
  }

  /*
   * =========================================================
   * FORCE SAVE
   * =========================================================
   */

  async function flushSave() {
    if (timeoutRef.current) {
      clearTimeout(
        timeoutRef.current
      );

      timeoutRef.current = null;
    }

    await saveNote(
      titleRef.current,
      contentRef.current
    );
  }

  /*
   * =========================================================
   * PIN
   * =========================================================
   */

  async function handlePin() {
    const nextPinned =
      !pinned;

    setPinned(nextPinned);

    try {
      await NoteService.pin(
        note.id,
        nextPinned
      );
    } catch (error) {
      console.error(
        "Failed to update pin:",
        error
      );

      setPinned(!nextPinned);
    }
  }

  /*
   * =========================================================
   * ARCHIVE
   * =========================================================
   */

  async function handleArchive() {
    const nextArchived =
      !archived;

    setArchived(nextArchived);

    try {
      await NoteService.archive(
        note.id,
        nextArchived
      );
    } catch (error) {
      console.error(
        "Failed to update archive:",
        error
      );

      setArchived(!nextArchived);
    }
  }

  /*
   * =========================================================
   * DELETE
   * =========================================================
   */

  async function handleDelete() {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this note?\n\nThis action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      await NoteService.delete(
        note.id
      );

      router.push(
        "/dashboard/notes"
      );
    } catch (error) {
      console.error(
        "Failed to delete note:",
        error
      );

      alert(
        "Failed to delete note."
      );
    }
  }

  /*
   * =========================================================
   * BACK
   * =========================================================
   */

  async function handleBack() {
    await flushSave();

    router.push(
      "/dashboard/notes"
    );
  }

  /*
   * =========================================================
   * LINK
   * =========================================================
   */

  function handleLink() {
    if (!editor) {
      return;
    }

    const previousUrl =
      editor.getAttributes(
        "link"
      ).href;

    const url =
      window.prompt(
        "Enter URL",
        previousUrl ||
          "https://"
      );

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      editor
        .chain()
        .focus()
        .unsetLink()
        .run();

      return;
    }

    let finalUrl =
      url.trim();

    if (
      !/^https?:\/\//i.test(
        finalUrl
      )
    ) {
      finalUrl =
        `https://${finalUrl}`;
    }

    editor
      .chain()
      .focus()
      .setLink({
        href: finalUrl,
        target: "_blank",
      })
      .run();
  }

  /*
   * =========================================================
   * HIGHLIGHT
   * =========================================================
   */

  function handleHighlight() {
    if (!editor) {
      return;
    }

    if (
      editor.isActive(
        "highlight"
      )
    ) {
      editor
        .chain()
        .focus()
        .unsetHighlight()
        .run();

      return;
    }

    editor
      .chain()
      .focus()
      .toggleHighlight({
        color: "#FEF08A",
      })
      .run();
  }

  /*
   * =========================================================
   * LOADING STATE
   * =========================================================
   */

  if (!editor) {
    return (
      <div className="space-y-6">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/notes"
            )
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-violet-600"
        >
          <span className="text-lg">
            ←
          </span>

          Back to Notes
        </button>

        <div className="card p-8">
          Loading editor...
        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div className="space-y-6">

      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-violet-600"
      >
        <span className="text-lg">
          ←
        </span>

        Back to Notes
      </button>

      {/* =====================================================
          MAIN EDITOR
      ===================================================== */}

      <div className="card overflow-hidden">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="border-b border-zinc-200 p-6 md:p-8">

          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

            {/* -----------------------------------------------
                TITLE + METADATA
            ------------------------------------------------ */}

            <div className="min-w-0 flex-1">

              <input
                value={title}
                onChange={
                  handleTitleChange
                }
                onBlur={flushSave}
                placeholder="Untitled Note"
                className="w-full border-none bg-transparent text-3xl font-bold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-300 md:text-4xl"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                  {note.category}
                </span>

                {subject && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                    {subject.name}

                    {subject.code
                      ? ` · ${subject.code}`
                      : ""}
                  </span>
                )}

                {module && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                    {module.name}
                  </span>
                )}

                {pinned && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    📌 Pinned
                  </span>
                )}

                {archived && (
                  <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700">
                    Archived
                  </span>
                )}

              </div>

              {subject && (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">

                  <span>
                    Semester{" "}
                    {subject.semester}
                  </span>

                  <span>
                    {subject.credits}{" "}
                    credit
                    {subject.credits !==
                    1
                      ? "s"
                      : ""}
                  </span>

                  {subject.faculty && (
                    <span>
                      Faculty:{" "}
                      {
                        subject.faculty
                      }
                    </span>
                  )}

                </div>
              )}

            </div>

            {/* -----------------------------------------------
                ACTIONS
            ------------------------------------------------ */}

            <div className="flex shrink-0 flex-col items-start gap-3 xl:items-end">

              <span
                className={`text-xs font-medium ${
                  status ===
                  "Failed to save"
                    ? "text-red-500"
                    : status ===
                      "Saving..."
                    ? "text-amber-600"
                    : status ===
                      "Unsaved"
                    ? "text-zinc-500"
                    : "text-emerald-600"
                }`}
              >
                {status}
              </span>

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={
                    handlePin
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50"
                >
                  {pinned
                    ? "📌 Unpin"
                    : "📌 Pin"}
                </button>

                <button
                  type="button"
                  onClick={
                    handleArchive
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50"
                >
                  {archived
                    ? "📂 Restore"
                    : "📦 Archive"}
                </button>

                <button
                  type="button"
                  onClick={
                    handleDelete
                  }
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  🗑 Delete
                </button>

              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            TAGS
        =================================================== */}

        {note.tags.length > 0 && (
          <div className="border-b border-zinc-200 px-6 py-4 md:px-8">

            <div className="flex flex-wrap gap-2">

              {note.tags.map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
                  >
                    #{tag}
                  </span>
                )
              )}

            </div>

          </div>
        )}

        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-3 py-3 backdrop-blur md:px-4">

          <div className="flex flex-wrap items-center gap-1">

            {/* -----------------------------------------------
                TEXT STYLE
            ------------------------------------------------ */}

            <ToolbarButton
              active={editor.isActive(
                "bold"
              )}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleBold()
                  .run()
              }
              title="Bold"
            >
              <strong>B</strong>
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive(
                "italic"
              )}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleItalic()
                  .run()
              }
              title="Italic"
            >
              <em>I</em>
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive(
                "underline"
              )}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleUnderline()
                  .run()
              }
              title="Underline"
            >
              <u>U</u>
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive(
                "strike"
              )}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleStrike()
                  .run()
              }
              title="Strikethrough"
            >
              <s>S</s>
            </ToolbarButton>

            <ToolbarDivider />

            {/* -----------------------------------------------
                HEADINGS
            ------------------------------------------------ */}

            <ToolbarButton
              active={editor.isActive(
                "heading",
                { level: 2 }
              )}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({
                    level: 2,
                  })
                  .run()
              }
              title="Heading 2"
            >
              H2
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive(
                "heading",
                { level: 3 }
              )}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({
                    level: 3,
                  })
                  .run()
              }
              title="Heading 3"
            >
              H3
            </ToolbarButton>

            <ToolbarDivider />

            {/* -----------------------------------------------
                LISTS
            ------------------------------------------------ */}

            <ToolbarButton
              active={editor.isActive(
                "bulletList"
              )}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleBulletList()
                  .run()
              }
              title="Bullet List"
            >
              •
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive(
                "orderedList"
              )}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleOrderedList()
                  .run()
              }
              title="Numbered List"
            >
              1.
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive(
                "taskList"
              )}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleTaskList()
                  .run()
              }
              title="Task List"
            >
              ☑
            </ToolbarButton>

            <ToolbarDivider />

            {/* -----------------------------------------------
                BLOCKS
            ------------------------------------------------ */}

            <ToolbarButton
              active={editor.isActive(
                "blockquote"
              )}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleBlockquote()
                  .run()
              }
              title="Quote"
            >
              “
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive(
                "codeBlock"
              )}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleCodeBlock()
                  .run()
              }
              title="Code Block"
            >
              {"</>"}
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setHorizontalRule()
                  .run()
              }
              title="Horizontal Rule"
            >
              ―
            </ToolbarButton>

            <ToolbarDivider />

            {/* -----------------------------------------------
                ALIGNMENT
            ------------------------------------------------ */}

            <ToolbarButton
              active={editor.isActive({
                textAlign:
                  "left",
              })}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setTextAlign(
                    "left"
                  )
                  .run()
              }
              title="Align Left"
            >
              ≡
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive({
                textAlign:
                  "center",
              })}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setTextAlign(
                    "center"
                  )
                  .run()
              }
              title="Align Center"
            >
              ≡
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive({
                textAlign:
                  "right",
              })}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setTextAlign(
                    "right"
                  )
                  .run()
              }
              title="Align Right"
            >
              ≡
            </ToolbarButton>

            <ToolbarDivider />

            {/* -----------------------------------------------
                LINK + HIGHLIGHT
            ------------------------------------------------ */}

            <ToolbarButton
              active={editor.isActive(
                "link"
              )}
              onClick={
                handleLink
              }
              title="Add Link"
            >
              🔗
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive(
                "highlight"
              )}
              onClick={
                handleHighlight
              }
              title="Highlight"
            >
              🖍
            </ToolbarButton>

            <ToolbarDivider />

            {/* -----------------------------------------------
                TABLE
            ------------------------------------------------ */}

            <ToolbarButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({
                    rows: 3,
                    cols: 3,
                    withHeaderRow:
                      true,
                  })
                  .run()
              }
              title="Insert Table"
            >
              ▦
            </ToolbarButton>

            {editor.isActive(
              "table"
            ) && (
              <>
                <ToolbarButton
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .addColumnAfter()
                      .run()
                  }
                  title="Add Column"
                >
                  +Col
                </ToolbarButton>

                <ToolbarButton
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .addRowAfter()
                      .run()
                  }
                  title="Add Row"
                >
                  +Row
                </ToolbarButton>

                <ToolbarButton
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .deleteColumn()
                      .run()
                  }
                  title="Delete Column"
                >
                  −Col
                </ToolbarButton>

                <ToolbarButton
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .deleteRow()
                      .run()
                  }
                  title="Delete Row"
                >
                  −Row
                </ToolbarButton>

                <ToolbarButton
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .deleteTable()
                      .run()
                  }
                  title="Delete Table"
                >
                  ×Table
                </ToolbarButton>
              </>
            )}

            <ToolbarDivider />

            {/* -----------------------------------------------
                CLEAR FORMATTING
            ------------------------------------------------ */}

            <ToolbarButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .unsetAllMarks()
                  .clearNodes()
                  .run()
              }
              title="Clear Formatting"
            >
              Tx
            </ToolbarButton>

            <ToolbarDivider />

            {/* -----------------------------------------------
                UNDO / REDO
            ------------------------------------------------ */}

            <ToolbarButton
              disabled={
                !editor.can().undo()
              }
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .undo()
                  .run()
              }
              title="Undo"
            >
              ↶
            </ToolbarButton>

            <ToolbarButton
              disabled={
                !editor.can().redo()
              }
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .redo()
                  .run()
              }
              title="Redo"
            >
              ↷
            </ToolbarButton>

          </div>

        </div>

        {/* ===================================================
            EDITOR
        =================================================== */}

        <div className="p-5 md:p-8">

          <EditorContent
            editor={editor}
            className="notes-editor"
            onBlur={flushSave}
          />

        </div>

      </div>

      {/* =====================================================
          GLOBAL TIPTAP STYLES
      ===================================================== */}

      <style jsx global>{`

        /* ===================================================
           TOOLBAR
        =================================================== */

        .toolbar-button {
          display: inline-flex;
          min-width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          padding: 0 9px;
          font-size: 13px;
          font-weight: 600;
          color: rgb(63 63 70);
          transition:
            background-color 150ms ease,
            color 150ms ease,
            transform 100ms ease;
          white-space: nowrap;
        }

        .toolbar-button:hover:not(:disabled) {
          background: rgb(244 244 245);
          color: rgb(124 58 237);
        }

        .toolbar-button:active:not(:disabled) {
          transform: scale(0.96);
        }

        .toolbar-button-active {
          background: rgb(237 233 254);
          color: rgb(109 40 217);
        }

        .toolbar-button:disabled {
          cursor: not-allowed;
          opacity: 0.3;
        }

        /* ===================================================
           EDITOR ROOT
        =================================================== */

        .notes-editor .ProseMirror {
          min-height: 700px;
          outline: none;
          color: rgb(39 39 42);
          font-size: 16px;
          line-height: 1.85;
        }

        .notes-editor .ProseMirror:focus {
          outline: none;
        }

        /* ===================================================
           PARAGRAPHS
        =================================================== */

        .notes-editor .ProseMirror p {
          margin: 0.75rem 0;
        }

        /* ===================================================
           HEADINGS
        =================================================== */

        .notes-editor .ProseMirror h1 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-size: 2rem;
          line-height: 1.25;
          font-weight: 800;
        }

        .notes-editor .ProseMirror h2 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-size: 1.5rem;
          line-height: 1.3;
          font-weight: 700;
        }

        .notes-editor .ProseMirror h3 {
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-size: 1.25rem;
          line-height: 1.4;
          font-weight: 700;
        }

        /* ===================================================
           LISTS
        =================================================== */

        .notes-editor .ProseMirror ul {
          margin: 1rem 0;
          padding-left: 1.75rem;
          list-style-type: disc;
        }

        .notes-editor .ProseMirror ol {
          margin: 1rem 0;
          padding-left: 1.75rem;
          list-style-type: decimal;
        }

        .notes-editor .ProseMirror li {
          margin: 0.35rem 0;
        }

        /* ===================================================
           TASK LIST
        =================================================== */

        .notes-editor .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          margin: 1rem 0;
          padding: 0;
        }

        .notes-editor
          .ProseMirror
          ul[data-type="taskList"]
          li {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          margin: 0.5rem 0;
        }

        .notes-editor
          .ProseMirror
          ul[data-type="taskList"]
          li
          > label {
          margin-top: 0.35rem;
          flex-shrink: 0;
        }

        .notes-editor
          .ProseMirror
          ul[data-type="taskList"]
          li
          > div {
          flex: 1;
        }

        /* ===================================================
           BLOCKQUOTE
        =================================================== */

        .notes-editor .ProseMirror blockquote {
          margin: 1.5rem 0;
          border-left: 4px solid rgb(124 58 237);
          border-radius: 0 10px 10px 0;
          background: rgb(250 245 255);
          padding: 0.75rem 1rem;
          color: rgb(82 82 91);
        }

        /* ===================================================
           CODE
        =================================================== */

        .notes-editor .ProseMirror code {
          border-radius: 5px;
          background: rgb(244 244 245);
          padding: 0.15rem 0.35rem;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;
          font-size: 0.9em;
        }

        .notes-editor .ProseMirror pre {
          margin: 1.5rem 0;
          overflow-x: auto;
          border-radius: 12px;
          background: rgb(24 24 27);
          padding: 1rem 1.25rem;
          color: white;
        }

        .notes-editor .ProseMirror pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }

        /* ===================================================
           HORIZONTAL RULE
        =================================================== */

        .notes-editor .ProseMirror hr {
          margin: 2rem 0;
          border: 0;
          border-top: 1px solid rgb(228 228 231);
        }

        /* ===================================================
           LINKS
        =================================================== */

        .notes-editor .ProseMirror a {
          color: rgb(124 58 237);
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* ===================================================
           HIGHLIGHT
        =================================================== */

        .notes-editor
          .ProseMirror
          mark {
          border-radius: 3px;
          padding: 0 2px;
        }

        /* ===================================================
           TABLES
        =================================================== */

        .notes-editor .ProseMirror table {
          width: 100%;
          margin: 1.5rem 0;
          overflow: hidden;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .notes-editor .ProseMirror th,
        .notes-editor .ProseMirror td {
          position: relative;
          min-width: 100px;
          border: 1px solid rgb(228 228 231);
          padding: 0.7rem 0.8rem;
          vertical-align: top;
          text-align: left;
        }

        .notes-editor .ProseMirror th {
          background: rgb(250 250 250);
          font-weight: 700;
        }

        .notes-editor .ProseMirror
          .selectedCell {
          background: rgb(237 233 254);
        }

        /* ===================================================
           PLACEHOLDER
        =================================================== */

        .notes-editor
          .ProseMirror
          p.is-editor-empty:first-child::before {
          content:
            "Start writing your notes...";
          float: left;
          height: 0;
          pointer-events: none;
          color: rgb(161 161 170);
        }

        /* ===================================================
           SELECTION
        =================================================== */

        .notes-editor
          .ProseMirror
          ::selection {
          background: rgb(221 214 254);
        }

        /* ===================================================
           MOBILE
        =================================================== */

        @media (max-width: 640px) {
          .notes-editor .ProseMirror {
            min-height: 600px;
            font-size: 15px;
            line-height: 1.8;
          }

          .notes-editor .ProseMirror h1 {
            font-size: 1.65rem;
          }

          .notes-editor .ProseMirror h2 {
            font-size: 1.35rem;
          }

          .notes-editor .ProseMirror h3 {
            font-size: 1.15rem;
          }

          .notes-editor .ProseMirror table {
            min-width: 600px;
          }
        }

      `}</style>

    </div>
  );
}

/*
 * ===========================================================
 * TOOLBAR BUTTON
 * ===========================================================
 */

interface ToolbarButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
}

function ToolbarButton({
  children,
  onClick,
  title,
  active = false,
  disabled = false,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      className={`toolbar-button ${
        active
          ? "toolbar-button-active"
          : ""
      }`}
    >
      {children}
    </button>
  );
}

/*
 * ===========================================================
 * TOOLBAR DIVIDER
 * ===========================================================
 */

function ToolbarDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-1 h-6 w-px bg-zinc-200"
    />
  );
}