// Core terminal contracts. Deliberately React-free and fully serializable: the
// scrollback (`Line[]`) is plain data so it can be tested, replayed (future
// `?cmd=` deep links), or persisted. React lives only in components/OutputBlock.tsx,
// which maps these structured variants to JSX.

export type Tone =
  | "default"
  | "muted"
  | "accent"
  | "warn"
  | "error"
  | "success"
  | "brand"; // Manchester United red — for the crest and [MUFC] lines

/**
 * A unit of command output. Structured (not a render callback) so output stays
 * serializable. The renderer decides how each variant is drawn.
 */
export type OutputContent =
  | { type: "text"; text: string; tone?: Tone; animate?: boolean }
  | { type: "ascii"; text: string; tone?: Tone } // pre-formatted block, never animated
  | { type: "link"; href: string; label: string; external?: boolean; tone?: Tone }
  | { type: "keyval"; pairs: Array<[string, string]>; tone?: Tone }
  | { type: "table"; columns?: string[]; rows: string[][]; tone?: Tone }
  | { type: "group"; items: OutputContent[] } // compose several blocks as one unit
  | { type: "spacer"; lines?: number };

/** A rendered line in the scrollback: either the echoed input or command output. */
export type Line =
  | { id: string; kind: "input"; prompt: string; value: string }
  | { id: string; kind: "output"; content: OutputContent };

/**
 * Runtime-only handle passed to a command's `run`. Holds functions, so it is
 * never stored in serializable state.
 */
export interface CommandContext {
  /** Tokenized args after the command name. */
  args: string[];
  /** The full trimmed input line. */
  raw: string;
  /** Append output to the scrollback. */
  print: (out: OutputContent | OutputContent[]) => void;
  /** Wipe the scrollback. */
  clear: () => void;
  /** Switch the active theme; returns false for an unknown name. */
  setTheme: (name: string) => boolean;
  /** Switch to the custom theme and open the color-picker panel. */
  openCustomizer: () => void;
  /** Clear the custom theme's overrides back to its base palette. */
  resetCustom: () => void;
  /** Replay the boot sequence. */
  startBoot: () => void;
  /** The currently active theme name. */
  theme: string;
  /** The command registry — lets commands enumerate their peers (help, autocomplete). */
  registry: Registry;
}

export interface Command {
  name: string;
  aliases?: string[];
  /** One-line description shown by `help`. */
  summary: string;
  /** Usage string shown by a future `man`. */
  usage?: string;
  /** Runnable but excluded from `help`/autocomplete (e.g. easter eggs). */
  hidden?: boolean;
  /** Optional argument autocompletion (wired in Step 4). */
  complete?: (args: string[], ctx: CommandContext) => string[];
  run: (
    ctx: CommandContext,
  ) =>
    | OutputContent
    | OutputContent[]
    | void
    | Promise<OutputContent | OutputContent[] | void>;
}

export interface Registry {
  lookup(name: string): Command | undefined;
  list(opts?: { includeHidden?: boolean }): Command[];
  names(includeHidden?: boolean): string[];
}
