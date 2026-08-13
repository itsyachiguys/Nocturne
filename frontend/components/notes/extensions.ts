import StarterKit from "@tiptap/starter-kit";

import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

export const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },

    // StarterKit already provides these.
    // We don't register them separately.
  }),

  Placeholder.configure({
    placeholder: "Start writing your notes...",
  }),

  Image,

  Highlight.configure({
    multicolor: true,
  }),

  TextStyle,

  Color,

  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),

  Table.configure({
    resizable: true,
  }),

  TableRow,
  TableHeader,
  TableCell,

  TaskList,

  TaskItem.configure({
    nested: true,
  }),
];