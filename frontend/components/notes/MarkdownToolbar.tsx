"use client";

const buttons = [
  "#",
  "##",
  "###",
  "**B**",
  "_I_",
  "- List",
  "1.",
  "```",
];

export default function MarkdownToolbar() {
  return (
    <div className="flex flex-wrap gap-2 mb-4">

      {buttons.map((button) => (

        <button
          key={button}
          type="button"
          className="btn-secondary"
        >
          {button}
        </button>

      ))}

    </div>
  );
}