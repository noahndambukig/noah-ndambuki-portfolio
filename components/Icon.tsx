import type { ReactNode } from "react";

// Minimal line-icons for bubbles. Stroke uses currentColor so icons inherit tone.
const PATHS: Record<string, ReactNode> = {
  terminal: (
    <>
      <path d="M4 6h16v12H4z" />
      <path d="M7 10l2.5 2L7 14" />
      <path d="M12.5 14H16" />
    </>
  ),
  folder: <path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c0-3.3 3.1-5 7-5s7 1.7 7 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-5.7-5.7L11 7" />
      <path d="M14 11a4 4 0 0 0-6-.5l-2 2A4 4 0 0 0 11.7 18L13 17" />
    </>
  ),
};

export function Icon({ name }: { name?: string }) {
  const path = (name && PATHS[name]) || PATHS.terminal;
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
