"use client";

import { useState } from "react";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.8 5.2A9.6 9.6 0 0 1 12 5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-3.3 4.1M6.2 6.2A17.6 17.6 0 0 0 2.5 12S6 18.5 12 18.5a9.5 9.5 0 0 0 3.4-.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Classes for the input itself (same ones you would give a normal input). */
  className?: string;
  /** Optional override for the toggle button colour, e.g. on dark backgrounds. */
  toggleClassName?: string;
};

/**
 * A password field with a built in show and hide toggle.
 *
 * Drop in replacement for a plain password input: pass the same props and
 * classes you would use on an input. The eye button flips the field between
 * hidden and visible so people can check what they typed. Used everywhere the
 * app asks for a password.
 */
export function PasswordInput({
  className = "",
  toggleClassName = "",
  ...props
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((value) => !value)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className={`absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted transition-colors hover:text-foreground ${toggleClassName}`}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
