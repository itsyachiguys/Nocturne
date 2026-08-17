"use client";

import { useEffect, useState } from "react";

import { Note, NoteCategory } from "@/types/note";
import { Subject } from "@/types/subject";
import { Module } from "@/types/module";

import { NoteService } from "@/services/note.service";
import { SubjectService } from "@/services/subject.service";
import { ModuleService } from "@/services/module.service";

interface Props {
  note: Note;
  onUpdated?: () => void;
}

const categories: NoteCategory[] = [
  "Academic",
  "Personal",
  "Placement",
  "Research",
  "Other",
];

export default function NoteMetadata({
  note,
  onUpdated,
}: Props) {
  const [category, setCategory] =
    useState<NoteCategory>(note.category);

  const [subjectId, setSubjectId] =
    useState(note.subjectId ?? "");

  const [moduleId, setModuleId] =
    useState(note.moduleId ?? "");

  const [tags, setTags] = useState<string[]>(
    note.tags ?? []
  );

  const [tagInput, setTagInput] = useState("");

  const [color, setColor] = useState(
    note.color || "#7C3AED"
  );

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);

  const [saving, setSaving] = useState(false);

  /*
   * Load subjects
   */
  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await SubjectService.getAll(
          note.studentId
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
  }, [note.studentId]);

  /*
   * Load modules whenever subject changes
   */
  useEffect(() => {
    async function loadModules() {
      if (!subjectId) {
        setModules([]);
        return;
      }

      try {
        const data =
          await ModuleService.getBySubject(subjectId);

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

  /*
   * Save metadata
   */
  async function saveMetadata(
    data: Partial<{
      category: NoteCategory;
      subjectId: string;
      moduleId: string;
      tags: string[];
      color: string;
    }>
  ) {
    try {
      setSaving(true);

      await NoteService.update(note.id, data);

      onUpdated?.();
    } catch (error) {
      console.error(
        "Failed to update note metadata:",
        error
      );

      alert("Failed to update note.");
    } finally {
      setSaving(false);
    }
  }

  /*
   * Category
   */
  async function handleCategoryChange(
    value: NoteCategory
  ) {
    setCategory(value);

    if (value !== "Academic") {
      setSubjectId("");
      setModuleId("");
      setModules([]);

      await saveMetadata({
        category: value,
        subjectId: "",
        moduleId: "",
      });

      return;
    }

    await saveMetadata({
      category: value,
    });
  }

  /*
   * Subject
   */
  async function handleSubjectChange(
    value: string
  ) {
    setSubjectId(value);
    setModuleId("");

    await saveMetadata({
      subjectId: value,
      moduleId: "",
    });
  }

  /*
   * Module
   */
  async function handleModuleChange(
    value: string
  ) {
    setModuleId(value);

    await saveMetadata({
      moduleId: value,
    });
  }

  /*
   * Add tag
   */
  async function handleAddTag() {
    const tag = tagInput.trim();

    if (!tag) return;

    if (
      tags.some(
        (existingTag) =>
          existingTag.toLowerCase() ===
          tag.toLowerCase()
      )
    ) {
      setTagInput("");
      return;
    }

    const updatedTags = [...tags, tag];

    setTags(updatedTags);
    setTagInput("");

    await saveMetadata({
      tags: updatedTags,
    });
  }

  /*
   * Remove tag
   */
  async function handleRemoveTag(
    tagToRemove: string
  ) {
    const updatedTags = tags.filter(
      (tag) => tag !== tagToRemove
    );

    setTags(updatedTags);

    await saveMetadata({
      tags: updatedTags,
    });
  }

  /*
   * Add tag with Enter
   */
  function handleTagKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }

  /*
   * Color
   */
  async function handleColorChange(
    value: string
  ) {
    setColor(value);

    await saveMetadata({
      color: value,
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-surface-alt p-5 dark:border-line-dark dark:bg-surface-alt-dark">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-primary dark:text-ink-primary-dark">
            Note Organization
          </h3>

          <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">
            Organize this note by category, subject,
            module and tags.
          </p>
        </div>

        {saving && (
          <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
            Saving...
          </span>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Category */}
        <div>
          <label className="mb-2 block text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark">
            Category
          </label>

          <select
            value={category}
            onChange={(e) =>
              handleCategoryChange(
                e.target.value as NoteCategory
              )
            }
            className="w-full rounded-xl border border-line bg-surface-card px-4 py-3 text-sm text-ink-primary outline-none transition focus:border-lavender dark:border-line-dark dark:bg-surface-card-dark dark:text-ink-primary-dark"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="mb-2 block text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark">
            Note Color
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-card px-4 py-2.5 dark:border-line-dark dark:bg-surface-card-dark">
            <input
              type="color"
              value={color}
              onChange={(e) =>
                handleColorChange(e.target.value)
              }
              className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
            />

            <span className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
              {color}
            </span>
          </div>
        </div>

        {/* Subject */}
        {category === "Academic" && (
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Subject
            </label>

            <select
              value={subjectId}
              onChange={(e) =>
                handleSubjectChange(e.target.value)
              }
              className="w-full rounded-xl border border-line bg-surface-card px-4 py-3 text-sm text-ink-primary outline-none transition focus:border-lavender dark:border-line-dark dark:bg-surface-card-dark dark:text-ink-primary-dark"
            >
              <option value="">No Subject</option>

              {subjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name}
                  {subject.code
                    ? ` (${subject.code})`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Module */}
        {category === "Academic" && (
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark">
              Module
            </label>

            <select
              value={moduleId}
              onChange={(e) =>
                handleModuleChange(e.target.value)
              }
              disabled={!subjectId}
              className="w-full rounded-xl border border-line bg-surface-card px-4 py-3 text-sm text-ink-primary outline-none transition focus:border-lavender disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-muted dark:border-line-dark dark:bg-surface-card-dark dark:text-ink-primary-dark dark:disabled:bg-surface-alt-dark dark:disabled:text-ink-muted-dark"
            >
              <option value="">
                {subjectId
                  ? "No Module"
                  : "Select a subject first"}
              </option>

              {modules.map((module) => (
                <option
                  key={module.id}
                  value={module.id}
                >
                  {module.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="mt-5">
        <label className="mb-2 block text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark">
          Tags
        </label>

        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) =>
              setTagInput(e.target.value)
            }
            onKeyDown={handleTagKeyDown}
            placeholder="Add a tag..."
            className="flex-1 rounded-xl border border-line bg-surface-card px-4 py-3 text-sm text-ink-primary outline-none transition placeholder:text-ink-muted focus:border-lavender dark:border-line-dark dark:bg-surface-card-dark dark:text-ink-primary-dark dark:placeholder:text-ink-muted-dark"
          />

          <button
            type="button"
            onClick={handleAddTag}
            className="rounded-xl border border-line bg-surface-card px-4 py-3 text-sm font-medium text-ink-secondary transition hover:bg-surface-alt dark:border-line-dark dark:bg-surface-card-dark dark:text-ink-secondary-dark dark:hover:bg-surface-alt-dark"
          >
            Add
          </button>
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  handleRemoveTag(tag)
                }
                className="rounded-full bg-lavender/15 px-3 py-1.5 text-xs font-medium text-lavender transition hover:bg-red-100 hover:text-red-600"
                title="Remove tag"
              >
                #{tag} ×
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}