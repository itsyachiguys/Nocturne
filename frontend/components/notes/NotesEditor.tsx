"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  EditorContent,
  useEditor,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";

import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { Note } from "@/types/note";
import { Subject } from "@/types/subject";
import { Module } from "@/types/module";

import { auth, db } from "@/lib/firebase";

import { NoteService } from "@/services/note.service";
import { SubjectService } from "@/services/subject.service";
import { ModuleService } from "@/services/module.service";

interface Props {
  note: Note;
}

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
}

type NoteWithFile = Note & {
  fileId?: string;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ACCEPTED_FILES = [
  "image/*",
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
  ".csv",
  ".zip",
].join(",");

export default function NotesEditor({ note }: Props) {
  const router = useRouter();
  const noteWithFile = note as NoteWithFile;

  const [title, setTitle] = useState(note.title);
  const [status, setStatus] = useState("Saved");
  const [pinned, setPinned] = useState(note.pinned);
  const [archived, setArchived] = useState(note.archived);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [module, setModule] = useState<Module | null>(null);

  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef(note.title);
  const contentRef = useRef(note.content || "");

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  async function saveNote(newTitle: string, newContent: string) {
    if (savingRef.current) return;

    savingRef.current = true;
    setStatus("Saving...");

    try {
      await NoteService.update(note.id, {
        title: newTitle,
        content: newContent,
      });

      setStatus("Saved");
    } catch (error) {
      console.error("Failed to save note:", error);
      setStatus("Failed to save");
    } finally {
      savingRef.current = false;
    }
  }

  function scheduleSave(newTitle: string, newContent: string) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus("Unsaved");

    timeoutRef.current = setTimeout(() => {
      saveNote(newTitle, newContent);
    }, 1000);
  }

  function uploadToCloudinary(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const cloudName =
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      const uploadPreset =
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName) {
        reject(new Error("Cloudinary cloud name is missing."));
        return;
      }

      if (!uploadPreset) {
        reject(new Error("Cloudinary upload preset is missing."));
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const xhr = new XMLHttpRequest();

      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
      );

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;

        const progress = Math.round(
          (event.loaded / event.total) * 100
        );

        setUploadProgress(progress);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);

            if (!response.secure_url) {
              reject(
                new Error(
                  "Cloudinary did not return a secure URL."
                )
              );
              return;
            }

            resolve(response.secure_url);
          } catch {
            reject(new Error("Invalid response from Cloudinary."));
          }

          return;
        }

        try {
          const response = JSON.parse(xhr.responseText);

          reject(
            new Error(
              response?.error?.message ||
                "Cloudinary upload failed."
            )
          );
        } catch {
          reject(new Error("Cloudinary upload failed."));
        }
      };

      xhr.onerror = () => {
        reject(
          new Error(
            "Network error while uploading to Cloudinary."
          )
        );
      };

      xhr.onabort = () => {
        reject(new Error("Cloudinary upload was cancelled."));
      };

      xhr.send(formData);
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAttachment() {
      if (!noteWithFile.fileId) {
        setAttachment(null);
        return;
      }

      try {
        const snapshot = await getDoc(
          doc(db, "uploaded_files", noteWithFile.fileId)
        );

        if (!snapshot.exists()) {
          setAttachment(null);
          return;
        }

        if (cancelled) return;

        const data = snapshot.data();

        setAttachment({
          id: snapshot.id,
          fileName: data.fileName || "Attachment",
          fileType:
            data.fileType || "application/octet-stream",
          fileUrl: data.fileUrl || "",
        });
      } catch (error) {
        console.error("Failed to load attachment:", error);
      }
    }

    loadAttachment();

    return () => {
      cancelled = true;
    };
  }, [noteWithFile.fileId]);

  async function handleFileUpload(file: File) {
    if (!auth.currentUser) {
      alert("You must be logged in to upload files.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("File size must be 25 MB or smaller.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const secureUrl = await uploadToCloudinary(file);

      setUploadProgress(100);

      const uploadedFileRef = await addDoc(
        collection(db, "uploaded_files"),
        {
          unitId: note.moduleId ?? "",
          studentId: auth.currentUser.uid,
          fileName: file.name,
          fileType:
            file.type || "application/octet-stream",
          fileUrl: secureUrl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      await NoteService.update(note.id, {
        fileId: uploadedFileRef.id,
      } as Partial<typeof note>);

      const uploadedAttachment: Attachment = {
        id: uploadedFileRef.id,
        fileName: file.name,
        fileType:
          file.type || "application/octet-stream",
        fileUrl: secureUrl,
      };

      setAttachment(uploadedAttachment);

      if (file.type.startsWith("image/") && editor) {
        editor
          .chain()
          .focus()
          .setImage({
            src: secureUrl,
            alt: file.name,
            title: file.name,
          })
          .run();
      }

      setStatus("Attachment saved");
    } catch (error) {
      console.error("Failed to upload attachment:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload attachment.";

      setUploadError(message);
      alert(`Failed to upload file.\n\n${message}`);
    } finally {
      setUploading(false);

      setTimeout(() => {
        setUploadProgress(0);
      }, 700);
    }
  }

  function handleFileInputChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    void handleFileUpload(file);
  }

  function openFilePicker() {
    if (uploading) return;
    fileInputRef.current?.click();
  }

  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        link: false,
      }),

      Underline,

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

      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class:
            "my-6 max-h-[700px] w-auto max-w-full rounded-2xl border border-zinc-200 object-contain dark:border-zinc-700",
        },
      }),

      Highlight.configure({
        multicolor: true,
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],
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
          class: "w-full border-collapse my-6",
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

      scheduleSave(titleRef.current, html);
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        if (note.subjectId) {
          const subjectData = await SubjectService.get(
            note.subjectId
          );

          if (!cancelled) {
            setSubject(subjectData);
          }
        } else {
          setSubject(null);
        }

        if (note.moduleId) {
          const moduleData = await ModuleService.get(
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
  }, [note.subjectId, note.moduleId]);

  useEffect(() => {
    if (!editor) return;

    const incomingContent = note.content || "";
    const currentContent = editor.getHTML();

    if (currentContent !== incomingContent) {
      editor.commands.setContent(incomingContent, {
        emitUpdate: false,
      });
    }

    setTitle(note.title);
    setPinned(note.pinned);
    setArchived(note.archived);

    titleRef.current = note.title;
    contentRef.current = incomingContent;
  }, [editor, note]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleTitleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = e.target.value;

    setTitle(value);
    titleRef.current = value;

    scheduleSave(value, contentRef.current);
  }

  async function flushSave() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    await saveNote(
      titleRef.current,
      contentRef.current
    );
  }

  async function handlePin() {
    const nextPinned = !pinned;
    setPinned(nextPinned);

    try {
      await NoteService.pin(note.id, nextPinned);
    } catch (error) {
      console.error(
        "Failed to update pin:",
        error
      );
      setPinned(!nextPinned);
    }
  }

  async function handleArchive() {
    const nextArchived = !archived;
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

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?\n\nThis action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await NoteService.delete(note.id);

      router.push("/dashboard/notes");
    } catch (error) {
      console.error(
        "Failed to delete note:",
        error
      );

      alert("Failed to delete note.");
    }
  }

  function handleLink() {
    if (!editor) return;

    const previousUrl =
      editor.getAttributes("link").href;

    const url = window.prompt(
      "Enter URL",
      previousUrl || "https://"
    );

    if (url === null) return;

    if (url.trim() === "") {
      editor
        .chain()
        .focus()
        .unsetLink()
        .run();

      return;
    }

    let finalUrl = url.trim();

    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
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

  function handleHighlight() {
    if (!editor) return;

    if (editor.isActive("highlight")) {
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

  if (!editor) {
    return (
      <div className="card p-8">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        {/* HEADER */}

        <div className="border-b border-zinc-200 p-6 dark:border-zinc-700 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <input
                value={title}
                onChange={handleTitleChange}
                onBlur={flushSave}
                placeholder="Untitled Note"
                className="w-full border-none bg-transparent text-3xl font-bold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-white dark:placeholder:text-zinc-600 md:text-4xl"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                  {note.category}
                </span>

                {subject && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                    {subject.name}
                    {subject.code
                      ? ` · ${subject.code}`
                      : ""}
                  </span>
                )}

                {module && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                    {module.name}
                  </span>
                )}

                {pinned && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    📌 Pinned
                  </span>
                )}

                {archived && (
                  <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                    Archived
                  </span>
                )}
              </div>

              {subject && (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    Semester {subject.semester}
                  </span>

                  <span>
                    {subject.credits} credit
                    {subject.credits !== 1
                      ? "s"
                      : ""}
                  </span>

                  {subject.faculty && (
                    <span>
                      Faculty: {subject.faculty}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-start gap-3 xl:items-end">
              <span
                className={`text-xs font-medium ${
                  status === "Failed to save"
                    ? "text-red-500"
                    : status === "Saving..."
                      ? "text-amber-600"
                      : status === "Unsaved"
                        ? "text-zinc-500 dark:text-zinc-400"
                        : status === "Attachment saved"
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-emerald-600"
                }`}
              >
                {status}
              </span>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePin}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  {pinned ? "📌 Unpin" : "📌 Pin"}
                </button>

                <button
                  type="button"
                  onClick={handleArchive}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  {archived
                    ? "📂 Restore"
                    : "📦 Archive"}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-400/30 dark:hover:bg-red-500/10"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TAGS */}

        {note.tags.length > 0 && (
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700 md:px-8">
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PROMINENT FILE UPLOAD */}

        <div className="border-b border-zinc-200 bg-violet-50/60 px-5 py-4 dark:border-zinc-700 dark:bg-violet-500/5 md:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Attach a file or image
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Images are added directly to your note. Other files are saved as attachments. Max 25 MB.
              </p>
            </div>

            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? `Uploading ${uploadProgress}%`
                : "📎 Attach File / Image"}
            </button>
          </div>
        </div>

        {/* TOOLBAR */}

        <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-3 py-3 backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/95 md:px-4">
          <div className="flex flex-wrap items-center gap-1">
            <ToolbarButton
              active={editor.isActive("bold")}
              onClick={() =>
                editor.chain().focus().toggleBold().run()
              }
              title="Bold"
            >
              <strong>B</strong>
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("italic")}
              onClick={() =>
                editor.chain().focus().toggleItalic().run()
              }
              title="Italic"
            >
              <em>I</em>
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("underline")}
              onClick={() =>
                editor.chain().focus().toggleUnderline().run()
              }
              title="Underline"
            >
              <u>U</u>
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("strike")}
              onClick={() =>
                editor.chain().focus().toggleStrike().run()
              }
              title="Strikethrough"
            >
              <s>S</s>
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: 2 })
                  .run()
              }
              title="Heading 2"
            >
              H2
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("heading", { level: 3 })}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: 3 })
                  .run()
              }
              title="Heading 3"
            >
              H3
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive("bulletList")}
              onClick={() =>
                editor.chain().focus().toggleBulletList().run()
              }
              title="Bullet List"
            >
              •
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("orderedList")}
              onClick={() =>
                editor.chain().focus().toggleOrderedList().run()
              }
              title="Numbered List"
            >
              1.
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("taskList")}
              onClick={() =>
                editor.chain().focus().toggleTaskList().run()
              }
              title="Task List"
            >
              ☑
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive("blockquote")}
              onClick={() =>
                editor.chain().focus().toggleBlockquote().run()
              }
              title="Quote"
            >
              “
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("codeBlock")}
              onClick={() =>
                editor.chain().focus().toggleCodeBlock().run()
              }
              title="Code Block"
            >
              {"</>"}
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setHorizontalRule().run()
              }
              title="Horizontal Rule"
            >
              ―
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive({ textAlign: "left" })}
              onClick={() =>
                editor.chain().focus().setTextAlign("left").run()
              }
              title="Align Left"
            >
              ≡
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive({ textAlign: "center" })}
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              title="Align Center"
            >
              ≡
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive({ textAlign: "right" })}
              onClick={() =>
                editor.chain().focus().setTextAlign("right").run()
              }
              title="Align Right"
            >
              ≡
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              active={editor.isActive("link")}
              onClick={handleLink}
              title="Add Link"
            >
              🔗
            </ToolbarButton>

            <ToolbarButton
              active={editor.isActive("highlight")}
              onClick={handleHighlight}
              title="Highlight"
            >
              🖍
            </ToolbarButton>

            <ToolbarDivider />

            {/* FILE / IMAGE UPLOAD BUTTON */}

            <ToolbarButton
              disabled={uploading}
              onClick={openFilePicker}
              title="Attach File or Image"
            >
              {uploading
                ? `${uploadProgress}%`
                : "📎"}
            </ToolbarButton>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_FILES}
              onChange={handleFileInputChange}
            />

            <ToolbarDivider />

            <ToolbarButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({
                    rows: 3,
                    cols: 3,
                    withHeaderRow: true,
                  })
                  .run()
              }
              title="Insert Table"
            >
              ▦
            </ToolbarButton>

            {editor.isActive("table") && (
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

            <ToolbarButton
              disabled={!editor.can().undo()}
              onClick={() =>
                editor.chain().focus().undo().run()
              }
              title="Undo"
            >
              ↶
            </ToolbarButton>

            <ToolbarButton
              disabled={!editor.can().redo()}
              onClick={() =>
                editor.chain().focus().redo().run()
              }
              title="Redo"
            >
              ↷
            </ToolbarButton>
          </div>
        </div>

        {/* HIDDEN INPUT */}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_FILES}
          onChange={handleFileInputChange}
        />

        {/* UPLOAD PROGRESS */}

        {uploading && (
          <div className="border-b border-zinc-200 bg-violet-50 px-5 py-3 dark:border-zinc-700 dark:bg-violet-500/10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-violet-700 dark:text-violet-300">
                Uploading attachment...
              </span>

              <span className="font-semibold text-violet-700 dark:text-violet-300">
                {uploadProgress}%
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-500/20">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-200"
                style={{
                  width: `${uploadProgress}%`,
                }}
              />
            </div>
          </div>
        )}

        {uploadError && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-400">
            {uploadError}
          </div>
        )}

        {/* EDITOR */}

        <div className="p-5 md:p-8">
          <EditorContent
            editor={editor}
            className="notes-editor"
            onBlur={flushSave}
          />
        </div>
      </div>

      {/* ATTACHMENT CARD */}

      {attachment && (
        <div className="card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xl dark:bg-violet-500/15">
                {attachment.fileType.startsWith("image/")
                  ? "🖼️"
                  : "📎"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                  {attachment.fileName}
                </p>

                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {attachment.fileType || "File"}
                </p>
              </div>
            </div>

            <a
              href={attachment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-violet-700"
            >
              Open File
            </a>
          </div>
        </div>
      )}

      <style jsx global>{`
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

        .dark .toolbar-button {
          color: rgb(212 212 216);
        }

        .dark .toolbar-button:hover:not(:disabled) {
          background: rgb(39 39 42);
          color: rgb(167 139 250);
        }

        .dark .toolbar-button-active {
          background: rgb(76 29 149 / 0.35);
          color: rgb(196 181 253);
        }

        .notes-editor .ProseMirror {
          min-height: 700px;
          outline: none;
          color: rgb(39 39 42);
          font-size: 16px;
          line-height: 1.85;
        }

        .dark .notes-editor .ProseMirror {
          color: rgb(228 228 231);
        }

        .notes-editor .ProseMirror:focus {
          outline: none;
        }

        .notes-editor .ProseMirror p {
          margin: 0.75rem 0;
        }

        .notes-editor .ProseMirror h1 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-size: 2rem;
          line-height: 1.25;
          font-weight: 800;
          color: inherit;
        }

        .notes-editor .ProseMirror h2 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-size: 1.5rem;
          line-height: 1.3;
          font-weight: 700;
          color: inherit;
        }

        .notes-editor .ProseMirror h3 {
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-size: 1.25rem;
          line-height: 1.4;
          font-weight: 700;
          color: inherit;
        }

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

        .notes-editor .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          margin: 1rem 0;
          padding: 0;
        }

        .notes-editor .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          margin: 0.5rem 0;
        }

        .notes-editor .ProseMirror ul[data-type="taskList"] li > label {
          margin-top: 0.35rem;
          flex-shrink: 0;
        }

        .notes-editor .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1;
        }

        .notes-editor .ProseMirror blockquote {
          margin: 1.5rem 0;
          border-left: 4px solid rgb(124 58 237);
          border-radius: 0 10px 10px 0;
          background: rgb(250 245 255);
          padding: 0.75rem 1rem;
          color: rgb(82 82 91);
        }

        .dark .notes-editor .ProseMirror blockquote {
          background: rgb(39 39 42);
          color: rgb(212 212 216);
        }

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

        .dark .notes-editor .ProseMirror code {
          background: rgb(39 39 42);
          color: rgb(228 228 231);
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

        .notes-editor .ProseMirror hr {
          margin: 2rem 0;
          border: 0;
          border-top: 1px solid rgb(228 228 231);
        }

        .dark .notes-editor .ProseMirror hr {
          border-top-color: rgb(63 63 70);
        }

        .notes-editor .ProseMirror a {
          color: rgb(124 58 237);
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .notes-editor .ProseMirror mark {
          border-radius: 3px;
          padding: 0 2px;
        }

        .notes-editor .ProseMirror img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 1.5rem auto;
          border-radius: 14px;
        }

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

        .dark .notes-editor .ProseMirror th,
        .dark .notes-editor .ProseMirror td {
          border-color: rgb(63 63 70);
        }

        .notes-editor .ProseMirror th {
          background: rgb(250 250 250);
          font-weight: 700;
        }

        .dark .notes-editor .ProseMirror th {
          background: rgb(39 39 42);
          color: rgb(244 244 245);
        }

        .notes-editor .ProseMirror .selectedCell {
          background: rgb(237 233 254);
        }

        .notes-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: "Start writing your notes...";
          float: left;
          height: 0;
          pointer-events: none;
          color: rgb(161 161 170);
        }

        .notes-editor .ProseMirror ::selection {
          background: rgb(221 214 254);
        }

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
        active ? "toolbar-button-active" : ""
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-700"
    />
  );
}
