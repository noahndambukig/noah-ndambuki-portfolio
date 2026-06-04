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
  | "success";

/**
 * Named CRT entrance animations played once when a line mounts (see OutputBlock /
 * globals.css `.ob-reveal`). Orthogonal to `animate` (typewriter) and to the
 * cards/table reveals — a line uses one or the other, never both.
 * - dispatch: transmit flicker — a command that opens an external link/channel
 * - slide:    left-to-right phosphor wipe-in (staggers across a group's lines)
 * - flash:    a glow pulse — a theme/color just changed
 * - glitch:   the boot banner's CRT glitch-in, reused for `home`
 */
export type Reveal = "dispatch" | "slide" | "flash" | "glitch";

/**
 * A unit of command output. Structured (not a render callback) so output stays
 * serializable. The renderer decides how each variant is drawn.
 */
export type OutputContent =
  | { type: "text"; text: string; tone?: Tone; animate?: boolean; reveal?: Reveal }
  | { type: "ascii"; text: string; tone?: Tone; reveal?: Reveal } // typewriter never, but a one-shot reveal is allowed
  | { type: "link"; href: string; label: string; external?: boolean; tone?: Tone; reveal?: Reveal }
  | { type: "keyval"; pairs: Array<[string, string]>; tone?: Tone }
  // Staggered left-to-right cascade on mount, row by row (e.g. `help` printing
  // its command roster). Off for static tables; on when a command freshly prints.
  | { type: "table"; columns?: string[]; rows: string[][]; tone?: Tone; animate?: boolean }
  | { type: "group"; items: OutputContent[] } // compose several blocks as one unit
  | { type: "spacer"; lines?: number }
  // Clickable bubbles. `run` is the command pasted into the prompt on click — the
  // visitor presses Enter to run it (serializable — no functions). Rendered by
  // OutputBlock via the terminal-actions context.
  | {
      type: "cards";
      items: Array<{ icon?: string; name: string; desc: string; run: string }>;
      // Staggered scanline reveal on mount. Off for the static launcher; on when
      // a command (e.g. `projects`) freshly prints the grid.
      animate?: boolean;
    };

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
  /** Open a project's detail view by slug. */
  openProject: (slug: string) => void;
  /** Open the snake game overlay. */
  openSnake: () => void;
  /** The currently active theme name. */
  theme: string;
  /** The command registry — lets commands enumerate their peers (help, autocomplete). */
  registry: Registry;
  /** Commands run this session (oldest first), including the current one — for `history`. */
  history: string[];
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
  /** Optional argument autocompletion. `ctx` is optional — completion runs it
   *  without one today, but the param is kept for future context-aware completers. */
  complete?: (args: string[], ctx?: CommandContext) => string[];
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
