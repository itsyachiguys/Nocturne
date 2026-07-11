"use client";

import { useId, useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

interface AuthInputProps {
  label: string;
  type?: "text" | "email" | "password";
  name: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}

// Single field used by both auth forms. Handles the password show/hide
// toggle locally so the pages themselves don't each carry their own
// visibility state.
export function AuthInput({
  label,
  type = "text",
  name,
  placeholder,
  autoComplete,
  required = true,
}: AuthInputProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-semibold text-ink-secondary dark:text-ink-secondary-dark"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword && visible ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full rounded-sm border border-line bg-surface-card px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-lavender/40 dark:border-line-dark dark:bg-surface-card-dark dark:text-ink-primary-dark dark:placeholder:text-ink-muted-dark"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary dark:text-ink-muted-dark"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
