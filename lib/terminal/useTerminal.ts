"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { commands } from "@/lib/commands";
import { notFound } from "@/lib/commands/notFound";
import { CUSTOM_THEME } from "@/lib/themes/themes";
import { useTheme } from "@/lib/themes/useTheme";
import { PROMPT } from "./constants";
import { parse } from "./parse";
import { createRegistry } from "./registry";
import type { CommandContext, Line, OutputContent } from "./types";

// Deterministic starting scrollback — static text (no timestamps), so server and
// client first paint match (no hydration mismatch). Fixed "w" ids avoid clashing
// with the runtime "l" counter.
function welcomeLines(): Line[] {
  return [
    {
      id: "w0",
      kind: "output",
      content: { type: "text", text: "ndambuki.terminal — v0.1.0", tone: "accent" },
    },
    {
      id: "w1",
      kind: "output",
      content: {
        type: "text",
        text: "type 'help' for commands · 'theme' to change colors",
        tone: "muted",
      },
    },
    { id: "w2", kind: "output", content: { type: "spacer" } },
  ];
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

  const [lines, setLines] = useState<Line[]>(welcomeLines);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Per-instance id counter (hot-reload safe; resets cleanly each mount).
  const idRef = useRef(0);
  const nextId = useCallback(() => `l${idRef.current++}`, []);

  // Submitted-command ring for ↑/↓ navigation, plus a non-state cursor.
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number | null>(null);

  const pushOutput = useCallback(
    (out: OutputContent | OutputContent[]) => {
      const arr = Array.isArray(out) ? out : [out];
      setLines((prev) => [
        ...prev,
        ...arr.map((content) => ({
          id: nextId(),
          kind: "output" as const,
          content,
        })),
      ]);
    },
    [nextId],
  );

  const clear = useCallback(() => setLines([]), []);

  // Opens the custom-theme picker. Owns the ordering: capture the CURRENT theme,
  // seed custom from it if there are no overrides yet, THEN switch to custom and
  // open the panel — so first-time custom seeds from what the visitor was viewing.
  const openCustomizer = useCallback(() => {
    if (!hasCustomOverrides()) seedCustomFrom(theme);
    setTheme(CUSTOM_THEME);
    setCustomizerOpen(true);
  }, [hasCustomOverrides, seedCustomFrom, theme, setTheme]);

  const closeCustomizer = useCallback(() => setCustomizerOpen(false), []);

  // Typing resets history navigation so the next ↑ starts from the newest entry.
  const handleInput = useCallback((value: string) => {
    historyIndexRef.current = null;
    setInput(value);
  }, []);

  const submit = useCallback(async () => {
    if (isRunning) return;

    const rawLine = input;
    setInput("");
    historyIndexRef.current = null;

    const parsed = parse(rawLine);

    setLines((prev) => [
      ...prev,
      { id: nextId(), kind: "input", prompt: PROMPT, value: rawLine },
    ]);

    if (parsed.name === "") return;
    historyRef.current = [...historyRef.current, rawLine];

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
      theme,
      registry,
    };

    try {
      setIsRunning(true);
      const result = await cmd.run(ctx);
      if (result) pushOutput(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushOutput({ type: "text", tone: "error", text: `error: ${message}` });
    } finally {
      setIsRunning(false);
    }
  }, [
    input,
    isRunning,
    registry,
    pushOutput,
    clear,
    setTheme,
    openCustomizer,
    resetCustom,
    theme,
    nextId,
  ]);

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
    input,
    setInput: handleInput,
    submit,
    isRunning,
    theme,
    historyPrev,
    historyNext,
    clear,
    // custom theme picker
    customizerOpen,
    openCustomizer,
    closeCustomizer,
    customVars,
    setCustomVar,
    resetCustom,
  };
}
