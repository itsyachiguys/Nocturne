"use client";

import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase";

import { uploadToCloudinary } from "@/lib/cloudinary";

import { SubjectService } from "@/services/subject.service";
import { ModuleService } from "@/services/module.service";
import { NoteService } from "@/services/note.service";
import { UploadedFileService } from "@/services/uploaded-file.service";

import { Subject } from "@/types/subject";
import { Module } from "@/types/module";
import { NoteCategory } from "@/types/note";

interface Props {
  onClose: () => void;
  onCreated: () => Promise<void>;
}

const colors = [
  "#7C3AED",
  "#2563EB",
  "#059669",
  "#EA580C",
  "#DB2777",
  "#DC2626",
];

export default function CreateNoteModal({
  onClose,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);

  const [title, setTitle] = useState("");

  const [category, setCategory] =
    useState<NoteCategory>("Academic");

  const [subjectId, setSubjectId] = useState("");
  const [moduleId, setModuleId] = useState("");

  const [tags, setTags] = useState("");

  const [color, setColor] =
    useState("#7C3AED");

  const [pinned, setPinned] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [uploadingFile, setUploadingFile] =
    useState(false);

  useEffect(() => {
    async function loadSubjects() {
      if (!auth.currentUser) return;

      try {
        const data =
          await SubjectService.getByStudent(
            auth.currentUser.uid
          );

        setSubjects(data);
      } catch (error) {
        console.error(
          "Failed to load subjects:",
          error
        );
      }
    }

    loadSubjects();
  }, []);

  useEffect(() => {
    async function loadModules() {
      if (!subjectId) {
        setModules([]);
        setModuleId("");
        return;
      }

      try {
        const data =
          await ModuleService.getBySubject(
            subjectId
          );

        setModules(data);
      } catch (error) {
        console.error(
          "Failed to load modules:",
          error
        );

        setModules([]);
      }
    }

    loadModules();
  }, [subjectId]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("You must be logged in.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    if (
      category === "Academic" &&
      !subjectId
    ) {
      alert("Please select a subject.");
      return;
    }

    /*
     * Attachments currently require a module
     * because moduleId is used as unitId
     * in uploaded_files.
     */
    if (selectedFile && !moduleId) {
      alert(
        "Please select a module before attaching a file."
      );
      return;
    }

    try {
      setLoading(true);

      const studentId =
        currentUser.uid;

      const subject = subjects.find(
        (item) =>
          item.id === subjectId
      );

      const module = modules.find(
        (item) =>
          item.id === moduleId
      );

      /*
       * 1. Create the note first.
       */
      const noteId =
        await NoteService.create({
          studentId,

          title: title.trim(),

          content: "",

          category,

          subjectId:
            subjectId || undefined,

          subjectName:
            subject?.name,

          moduleId:
            moduleId || undefined,

          moduleName:
            module?.name,

          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),

          pinned,

          archived: false,

          color,
        });

      /*
       * 2. Upload the selected file
       *    if the user attached one.
       */
      if (selectedFile) {
        try {
          setUploadingFile(true);
          setUploadProgress(0);

          const uploaded =
            await uploadToCloudinary(
              selectedFile,
              (progress) => {
                setUploadProgress(
                  progress
                );
              }
            );

          /*
           * 3. Create uploaded_files
           *    Firestore document.
           */
          const fileId =
            await UploadedFileService.create({
              unitId: moduleId,

              studentId,

              fileName:
                selectedFile.name,

              fileType:
                selectedFile.type ||
                uploaded.format,

              fileUrl:
                uploaded.secure_url,
            });

          /*
           * 4. Connect the file
           *    to the note.
           */
          await NoteService.update(
            noteId,
            {
              fileId,
            }
          );
        } catch (uploadError) {
          console.error(
            "File upload failed:",
            uploadError
          );

          alert(
            uploadError instanceof Error
              ? `Note created, but file upload failed.\n\n${uploadError.message}`
              : "Note created, but file upload failed."
          );
        } finally {
          setUploadingFile(false);
          setUploadProgress(0);
        }
      }

      await onCreated();

      onClose();
    } catch (error) {
      console.error(
        "Create note error:",
        error
      );

      alert(
        "Failed to create note."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-8 shadow-xl dark:bg-zinc-900">

        <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          Create Note
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* Category */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value as NoteCategory
                )
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="Academic">
                Academic
              </option>

              <option value="Personal">
                Personal
              </option>

              <option value="Placement">
                Placement
              </option>

              <option value="Research">
                Research
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          {/* Title */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Lecture 5 Notes"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {/* Academic fields */}

          {category === "Academic" && (
            <>
              {/* Subject */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </label>

                <select
                  value={subjectId}
                  onChange={(e) =>
                    setSubjectId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="">
                    Select Subject
                  </option>

                  {subjects.map(
                    (subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Module */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Module
                </label>

                <select
                  value={moduleId}
                  onChange={(e) =>
                    setModuleId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="">
                    Select Module
                  </option>

                  {modules.map(
                    (module) => (
                      <option
                        key={module.id}
                        value={module.id}
                      >
                        {module.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </>
          )}

          {/* Tags */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>

            <input
              value={tags}
              onChange={(e) =>
                setTags(e.target.value)
              }
              placeholder="exam, regression, important"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Separate multiple tags
              with commas.
            </p>
          </div>

          {/* Attachment */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Attachment
            </label>

            <input
              type="file"
              onChange={(e) => {
                const file =
                  e.target.files?.[0] ??
                  null;

                setSelectedFile(file);
              }}
              disabled={
                loading ||
                uploadingFile
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-700 hover:file:bg-violet-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:file:bg-violet-950 dark:file:text-violet-300"
            />

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Attach a PDF, presentation,
              document, image, or other
              study file.
            </p>

            {selectedFile && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">

                <div className="flex items-center justify-between gap-4">

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {(
                        selectedFile.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(
                        null
                      );

                      setUploadProgress(
                        0
                      );
                    }}
                    disabled={
                      loading ||
                      uploadingFile
                    }
                    className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Remove
                  </button>

                </div>

                {uploadingFile && (
                  <div className="mt-4">

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Uploading...
                      </span>

                      <span className="text-xs font-semibold text-violet-600">
                        {uploadProgress}%
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">

                      <div
                        className="h-full rounded-full bg-violet-600 transition-all duration-200"
                        style={{
                          width: `${uploadProgress}%`,
                        }}
                      />

                    </div>

                  </div>
                )}

              </div>
            )}
          </div>

          {/* Color */}

          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>

            <div className="flex gap-3">

              {colors.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setColor(item)
                  }
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    color === item
                      ? "border-black dark:border-white"
                      : "border-transparent"
                  }`}
                  style={{
                    backgroundColor:
                      item,
                  }}
                  aria-label={`Select ${item} note color`}
                />
              ))}

            </div>
          </div>

          {/* Pin */}

          <label className="flex items-center gap-3 text-gray-700 dark:text-gray-300">

            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) =>
                setPinned(
                  e.target.checked
                )
              }
              disabled={
                loading ||
                uploadingFile
              }
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />

            <span>
              Pin this note
            </span>

          </label>

          {/* Actions */}

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              disabled={
                loading ||
                uploadingFile
              }
              className="rounded-xl border border-gray-300 px-5 py-3 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                uploadingFile
              }
              className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingFile
                ? `Uploading ${uploadProgress}%`
                : loading
                  ? "Creating..."
                  : "Create Note"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}