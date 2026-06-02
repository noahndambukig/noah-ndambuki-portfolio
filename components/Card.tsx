"use client";

import { Icon } from "./Icon";
import { useTerminalActions } from "./TerminalActions";

// A clickable "bubble": icon + name + description. Clicking pastes `run` into the
// prompt (the visitor then presses Enter to run it) — it does not auto-execute.
// Reused by the home launcher and the projects grid.
export function Card({
  icon,
  name,
  desc,
  run,
}: {
  icon?: string;
  name: string;
  desc: string;
  run: string;
}) {
  const { fillCommand } = useTerminalActions();
  return (
    <button
      type="button"
      className="card"
      onClick={() => fillCommand(run)}
      aria-label={`${name} — ${desc} (press Enter to run)`}
    >
      <span className="card-icon">
        <Icon name={icon} />
      </span>
      <span className="card-text">
        <span className="card-name">{name}</span>
        <span className="card-desc">{desc}</span>
      </span>
    </button>
  );
}
