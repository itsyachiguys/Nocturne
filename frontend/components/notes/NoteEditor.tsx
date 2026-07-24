"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function NoteEditor({
  value,
  onChange,
}: Props) {

  return (
    <textarea
      className="input min-h-[500px] w-full"
      placeholder="Start writing..."
      value={value}
      onChange={(e)=>
        onChange(e.target.value)
      }
    />
  );
}