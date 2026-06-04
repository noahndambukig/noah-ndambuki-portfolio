"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { commands } from "@/lib/commands";
import { notFound } from "@/lib/commands/notFound";
import { NAME_BANNER } from "@/lib/content/ascii";
import { launcherCards } from "@/lib/content/launcher";
import { CUSTOM_THEME } from "@/lib/themes/themes";
import { useTheme } from "@/lib/themes/useTheme";
import {
  BANNER_LINE_ID,
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  PROMPT,
} from "./constants";
import { autocomplete, suggest } from "./autocomplete";
import { parse } from "./parse";
import { createRegistry } from "./registry";
import type { CommandContext, Line, OutputContent } from "./types";

// The resting scrollback (also the SSR / no-JS state): the name banner, a
// tagline, and a hint. Static text + fixed ids → server and client first paint
// match. The banner carries BANNER_LINE_ID so the boot can re-trigger its glitch.
function bannerLine(): Line {
  return {
    id: BANNER_LINE_ID,
    kind: "output",
    content: { type: "ascii", text: NAME_BANNER, tone: "accent" },
  };
}

function restingLines(): Line[] {
  return [
    bannerLine(),
    {
      id: "hint",
      kind: "output",
      content: {
        type: "text",
        text: "type 'help' for commands, or click a card below",
        tone: "muted",
      },
    },
    { id: "launcher", kind: "output", content: launcherCards },
    { id: "rest-space", kind: "output", content: { type: "spacer" } },
  ];
}

// Which "screen" is showing: the terminal home, a project's detail page, or the
// snake game overlay.
type View = { kind: "home" } | { kind: "project"; slug: string } | { kind: "snake" };

// Must match the .scrollback-content.clearing animation duration in globals.css.
const CLEAR_DURATION = 420;

// Command history persistence. Read tolerates absent/corrupt storage (returns
// []) and filters to strings so a tampered value can't poison navigation; write
// keeps only the most recent HISTORY_LIMIT entries so storage stays bounded.
function readStoredHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function persistHistory(history: string[]): void {
  try {
    localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(-HISTORY_LIMIT)),
    );
  } catch {
    /* ignore persistence failure */
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useTerminal() {
  const registry = useMemo(() => createRegistry(commands), []);
  const {
    theme,
    setTheme,
    customVars,
    setCustomVar,
    resetCustom,
    seedCustomFrom,
    hasCustomOverrides,
  } = useTheme();

  const [lines, setLines] = useState<Line[]>(restingLines);
  const [input, setInput] = useState("");
  const [clearing, setClearing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [view, setView] = useState<View>({ kind: "home" });

  // Boot state. `booting` starts false (so SSR/no-JS render the resting state and
  // there is no hydration mismatch); a mount effect starts it on the client.
  const [booting, setBooting] = useState(false);
  const [bootReveal, setBootReveal] = useState(0);

  const idRef = useRef(0);
  const nextId = useCallback(() => `l${idRef.current++}`, []);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number | null>(null);

  const startBoot = useCallback(() => {
    // Replay boot as if the page were refreshed: close the picker, wipe the
    // scrollback / current input, and restore the fresh welcome (banner +
    // tagline + launcher) so the post-boot handoff matches a reload. Command
    // history is reloaded from storage (not wiped) — a real refresh keeps it.
    setCustomizerOpen(false);
    setLines(restingLines());
    setInput("");
    historyRef.current = readStoredHistory();
    historyIndexRef.current = null;
    setBooting(true);
  }, []);
  const completeBoot = useCallback(() => {
    setBooting(false);
    setBootReveal((c) => c + 1); // re-key the banner so its glitch-reveal fires
  }, []);

  // Restore the previous session's command history after the SSR paint (so no
  // hydration mismatch). startBoot also rehydrates it, but reduced-motion
  // visitors skip the boot, so this effect covers them.
  useEffect(() => {
    const stored = readStoredHistory();
    if (stored.length) historyRef.current = stored;
  }, []);

  // Auto-play the boot on first mount, unless the visitor prefers reduced motion.
  useEffect(() => {
    if (!prefersReducedMotion()) startBoot();
  }, [startBoot]);

  const pushOutput = useCallback(
    (out: OutputContent | OutputContent[]) => {
      const arr = Array.isArray(out) ? out : [out];
      setLines((prev) => [
        ...prev,
        ...arr.map((content) => ({ id: nextId(), kind: "output" as const, content })),
      ]);
    },
    [nextId],
  );

  // Clear plays a CRT power-down collapse (the inverse of the boot's power-on)
  // before wiping the scrollback. Reduced-motion / a clear already in flight wipe
  // instantly. The timer is cleared on unmount so it never sets state after.
  const clearTimer = useRef<number | null>(null);
  const clear = useCallback(() => {
    if (prefersReducedMotion()) {
      setLines([]);
      return;
    }
    if (clearTimer.current !== null) return;
    setClearing(true);
    clearTimer.current = window.setTimeout(() => {
      setLines([]);
      setClearing(false);
      clearTimer.current = null;
    }, CLEAR_DURATION);
  }, []);
  useEffect(() => () => {
    if (clearTimer.current !== null) window.clearTimeout(clearTimer.current);
  }, []);

  const handleInput = useCallback((value: string) => {
    historyIndexRef.current = null;
    setInput(value);
  }, []);

  // Tab completion. Applies a completion through handleInput (which resets history
  // navigation), or prints the ambiguous candidates.
  const complete = useCallback(() => {
    const result = autocomplete(input, registry);
    if (result.completion !== undefined) {
      handleInput(result.completion);
    } else if (result.listing?.length) {
      pushOutput({ type: "text", tone: "muted", text: result.listing.join("  ") });
    }
  }, [input, registry, handleInput, pushOutput]);

  // Ghost suffix shown inline after the input when exactly one completion remains.
  const suggestion = useMemo(() => suggest(input, registry), [input, registry]);

  const openCustomizer = useCallback(() => {
    // Capture the active theme BEFORE switching so first-time custom seeds from
    // what the visitor was viewing, not the custom base.
    if (!hasCustomOverrides()) seedCustomFrom(theme);
    setTheme(CUSTOM_THEME);
    setCustomizerOpen(true);
  }, [hasCustomOverrides, seedCustomFrom, theme, setTheme]);

  const closeCustomizer = useCallback(() => setCustomizerOpen(false), []);

  const openProject = useCallback((slug: string) => {
    // Close the picker so the two overlays are never open at once (avoids the
    // editor staying focusable behind the modal + a single Esc closing both).
    setCustomizerOpen(false);
    setView({ kind: "project", slug });
  }, []);
  const openSnake = useCallback(() => {
    // Same single-overlay invariant as openProject: never leave the picker open
    // (and focusable) behind the game.
    setCustomizerOpen(false);
    setView({ kind: "snake" });
  }, []);
  const closeView = useCallback(() => setView({ kind: "home" }), []);

  // Shared core: echo the line, record it in history, run the command. Driven by
  // submit() when the visitor presses Enter.
  const execute = useCallback(
    async (rawLine: string) => {
      if (isRunning) return;
      historyIndexRef.current = null;

      const parsed = parse(rawLine);
      setLines((prev) => [
        ...prev,
        { id: nextId(), kind: "input", prompt: PROMPT, value: rawLine },
      ]);

      if (parsed.name === "") return;
      historyRef.current = [...historyRef.current, rawLine];
      persistHistory(historyRef.current);

      const cmd = registry.lookup(parsed.name);
      if (!cmd) {
        pushOutput(notFound(parsed.name));
        return;
      }

      const ctx: CommandContext = {
        args: parsed.args,
        raw: parsed.raw,
        print: pushOutput,
        clear,
        setTheme,
        openCustomizer,
        resetCustom,
        startBoot,
        openProject,
        openSnake,
        theme,
        registry,
        history: [...historyRef.current],
      };

      try {
        setIsRunning(true);
        const result = await cmd.run(ctx);
        if (result) pushOutput(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        pushOutput({ type: "text", tone: "error", text: `error: ${message}`, animate: true });
      } finally {
        setIsRunning(false);
      }
    },
    [
      isRunning,
      registry,
      pushOutput,
      clear,
      setTheme,
      openCustomizer,
      resetCustom,
      startBoot,
      openProject,
      openSnake,
      theme,
      nextId,
    ],
  );

  const submit = useCallback(() => {
    const rawLine = input;
    setInput("");
    // Empty / whitespace-only Enter is a no-op: the prompt is now a pinned box,
    // so there's no "fresh prompt line" to echo — it would just be clutter.
    if (rawLine.trim() === "") return;
    void execute(rawLine);
  }, [input, execute]);

  const historyPrev = useCallback(() => {
    const h = historyRef.current;
    if (h.length === 0) return;
    const cur = historyIndexRef.current;
    const next = cur === null ? h.length - 1 : Math.max(0, cur - 1);
    historyIndexRef.current = next;
    setInput(h[next]);
  }, []);

  const historyNext = useCallback(() => {
    const h = historyRef.current;
    const cur = historyIndexRef.current;
    if (cur === null) return;
    const next = cur + 1;
    if (next >= h.length) {
      historyIndexRef.current = null;
      setInput("");
      return;
    }
    historyIndexRef.current = next;
    setInput(h[next]);
  }, []);

  return {
    lines,
    clearing,
    input,
    setInput: handleInput,
    submit,
    complete,
    suggestion,
    isRunning,
    theme,
    setTheme,
    historyPrev,
    historyNext,
    clear,
    // project detail view
    view,
    openProject,
    openSnake,
    closeView,
    // boot
    booting,
    completeBoot,
    bootReveal,
    startBoot,
    // custom theme picker
    customizerOpen,
    openCustomizer,
    closeCustomizer,
    customVars,
    setCustomVar,
    resetCustom,
  };
}
