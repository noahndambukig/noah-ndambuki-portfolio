// Projects shown as bubbles by `projects`; clicking one opens its detail view.
// Placeholder content — edit freely. Add an `image` block only once the image
// exists in public/projects/ (the renderer never probes the filesystem).

export type DetailBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "image"; src: string; alt?: string; caption?: string };

export interface Project {
  slug: string;
  name: string;
  blurb: string;
  tech: string[];
  year?: string;
  url?: string; // live demo
  repo?: string; // source
  icon?: string; // Card icon key
  detail?: { blocks: DetailBlock[] };
}

export const projects: Project[] = [
  {
    slug: "ndambuki-terminal",
    name: "ndambuki.terminal",
    blurb: "This site — a terminal-style portfolio you type (or click) through.",
    tech: ["Next.js", "TypeScript", "React"],
    year: "2026",
    url: "https://ndambuki.ca",
    repo: "https://github.com/noahndambukig/noah-ndambuki-portfolio",
    icon: "terminal",
    detail: {
      blocks: [
        {
          kind: "paragraph",
          text:
            "A personal portfolio built as a fully interactive terminal: a command " +
            "engine with history and tab-completion, switchable CRT themes (plus a live " +
            "color picker), a cinematic boot sequence, and clickable command bubbles for a " +
            "GUI-hybrid experience.",
        },
        { kind: "heading", text: "Architecture" },
        {
          kind: "paragraph",
          text:
            "Next.js (App Router) exported as a fully static site to GitHub Pages. A small " +
            "command registry maps typed input to handlers that return a serializable output " +
            "model, which a single renderer turns into JSX — keeping the engine framework-light " +
            "and testable.",
        },
        { kind: "heading", text: "Highlights" },
        {
          kind: "bullets",
          items: [
            "Command registry: add a command in one file; it auto-joins help, autocomplete, and ghost suggestions.",
            "Theme tokens from a single source drive SSR paint, a no-flash script, and a live custom-color picker.",
            "Reusable clickable bubbles power both the home launcher and the projects grid.",
          ],
        },
      ],
    },
  },
  {
    slug: "project-two",
    name: "Project Two",
    blurb: "A short, punchy one-liner about what this project does. (placeholder)",
    tech: ["React", "Node.js"],
    year: "2025",
    repo: "https://github.com/noahndambukig",
    icon: "folder",
    detail: {
      blocks: [
        { kind: "paragraph", text: "Replace this with a real description of the project." },
        { kind: "heading", text: "What it does" },
        { kind: "bullets", items: ["Key feature one", "Key feature two", "Key feature three"] },
      ],
    },
  },
  {
    slug: "project-three",
    name: "Project Three",
    blurb: "Another placeholder project — swap in something real. (placeholder)",
    tech: ["TypeScript", "Python"],
    year: "2024",
    icon: "folder",
    detail: {
      blocks: [
        { kind: "paragraph", text: "Replace this with a real description of the project." },
      ],
    },
  },
];
