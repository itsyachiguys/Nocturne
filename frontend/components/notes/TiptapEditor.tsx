"use client";

import { useEffect } from "react";
import {
  EditorContent,
  useEditor,
} from "@tiptap/react";

import { editorExtensions } from "./extensions";
import EditorToolbar from "./EditorToolbar";

interface Props {
  content: string;
  onChange: (content: string) => void;
}

export default function TiptapEditor({
  content,
  onChange,
}: Props) {
  const editor = useEditor({
    extensions: editorExtensions,

    content,

    immediatelyRender: false,

    editorProps: {
      attributes: {
        class:
          "prose max-w-none min-h-[650px] p-6 focus:outline-none",
      },
    },

    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    if (editor.getHTML() !== content) {
      editor.commands.setContent(content, {
        emitUpdate: false,
      });
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">

      <EditorToolbar editor={editor} />

      <EditorContent editor={editor} />

    </div>
  );
}