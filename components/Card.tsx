"use client";

import { Icon } from "./Icon";
import { useTerminalActions } from "./TerminalActions";

// A clickable "bubble": icon + name + description. Clicking runs `run` as a
// command (same as typing it). Reused by the home launcher and the projects grid.
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
  const { runCommand } = useTerminalActions();
  return (
    <button
      type="button"
      className="card"
      onClick={() => runCommand(run)}
      aria-label={`${name} — ${desc}`}
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
