// A thin fictional home directory for visitor@ndambuki — just enough of a shell
// for `ls`/`cat` to feel real. It is a skin over the existing content (profile,
// projects), never a second source of truth: bodies point back at the live
// commands. Two levels deep (home + projects/) is plenty of authenticity.

import { profile } from "./profile";
import { projects } from "./projects";

export interface FsEntry {
  name: string;
  type: "file" | "dir";
  /** Lines printed by `cat` (blank strings render as blank lines). */
  body?: string[];
  /** The live command to run for the formatted/interactive version. */
  hint?: string;
}

const HOME: FsEntry[] = [
  {
    name: "about.txt",
    type: "file",
    hint: "about",
    body: [`${profile.name} — ${profile.role}`, "", profile.bio],
  },
  {
    name: "experience.log",
    type: "file",
    hint: "experience",
    body: ["Roles, projects, and the occasional 3am commit.", "Run 'experience' for the formatted timeline."],
  },
  {
    name: "contact.md",
    type: "file",
    hint: "contact",
    body: [
      `email     ${profile.links.email}`,
      `github    ${profile.links.github}`,
      `linkedin  ${profile.links.linkedin}`,
    ],
  },
  {
    name: "resume.pdf",
    type: "file",
    hint: "resume",
    body: ["%PDF-1.7 …binary file…", "Run 'resume' to open it."],
  },
  { name: "projects", type: "dir", hint: "projects" },
];

// One "file" per project, generated from the live list so it never drifts.
const PROJECTS_DIR: FsEntry[] = projects.map((p) => ({
  name: `${p.slug}.md`,
  type: "file",
  hint: `open ${p.slug}`,
  body: [p.name, "", p.blurb, "", `tech: ${p.tech.join(", ")}`],
}));

// The only directories that exist, keyed by their normalized path.
const DIRS: Record<string, FsEntry[]> = { "": HOME, projects: PROJECTS_DIR };

// Strip the leading ~/ ./ / and any trailing slash so "~/projects/" === "projects".
function normalize(path: string): string {
  return path.replace(/^[~./]+/, "").replace(/\/+$/, "");
}

export type Resolved =
  | { kind: "dir"; entries: FsEntry[] }
  | { kind: "file"; entry: FsEntry };

/** Resolve a path to a directory or file node, or null if it does not exist. */
export function resolve(path: string): Resolved | null {
  const clean = normalize(path);
  if (clean in DIRS) return { kind: "dir", entries: DIRS[clean] };

  const slash = clean.lastIndexOf("/");
  const parent = slash === -1 ? "" : clean.slice(0, slash);
  const name = slash === -1 ? clean : clean.slice(slash + 1);
  const entry = DIRS[parent]?.find((e) => e.name === name);
  if (!entry) return null;
  return entry.type === "dir"
    ? { kind: "dir", entries: DIRS[name] ?? [] }
    : { kind: "file", entry };
}

/** Tab-completion candidates for a partial path (used by `ls` and `cat`). */
export function pathCandidates(partial: string): string[] {
  const slash = partial.lastIndexOf("/");
  const parent = normalize(slash === -1 ? "" : partial.slice(0, slash));
  const base = slash === -1 ? partial : partial.slice(slash + 1);
  const prefix = slash === -1 ? "" : partial.slice(0, slash + 1);
  return (DIRS[parent] ?? [])
    .filter((e) => e.name.startsWith(base))
    .map((e) => `${prefix}${e.name}${e.type === "dir" ? "/" : ""}`);
}
