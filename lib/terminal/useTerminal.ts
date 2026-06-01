"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { commands } from "@/lib/commands";
import { notFound } from "@/lib/commands/notFound";
import { NAME_BANNER } from "@/lib/content/ascii";
import { CUSTOM_THEME } from "@/lib/themes/themes";
import { useTheme } from "@/lib/themes/useTheme";
import { BANNER_LINE_ID, PROMPT } from "./constants";
import { autocomplete, suggest } from "./autocomplete";
import { parse } from "./parse";
import { createRegistry } from "./registry";
import type { CommandContext, Line, OutputContent } from "./types";

// The resting scrollback (also the SSR / no-JS state): the name banner, a
// tagline, and a hint. Static text + fixed ids → server and client first paint
// match. The banner carries BANNER_LINE_ID so the boot can re-trigger its glitch.
function restingLines(): Line[] {
  return [
    {
      id: BANNER_LINE_ID,
      kind: "output",
      content: { type: "ascii", text: NAME_BANNER, tone: "accent" },
    },
    {
      id: "hint",
      kind: "output",
      content: {
        type: "text",
        text: "type 'help' for commands · 'boot' to replay · 'mufc' for facts",
        tone: "muted",
      },
    },
    { id: "rest-space", kind: "output", content: { type: "spacer" } },
  ];
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
  const [isRunning, setIsRunning] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Boot state. `booting` starts false (so SSR/no-JS render the resting state and
  // there is no hydration mismatch); a mount effect starts it on the client.
  const [booting, setBooting] = useState(false);
  const [bootReveal, setBootReveal] = useState(0);

  const idRef = useRef(0);
  const nextId = useCallback(() => `l${idRef.current++}`, []);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number | null>(null);

  const startBoot = useCallback(() => {
    // Close the picker so it can't sit (focusable) behind the boot overlay.
    setCustomizerOpen(false);
    // Guarantee a banner to glitch-reveal at handoff — e.g. after `clear` wiped it.
    setLines((prev) =>
      prev.some((l) => l.id === BANNER_LINE_ID)
        ? prev
        : [...restingLines(), ...prev],
    );
    setBooting(true);
  }, []);
  const completeBoot = useCallback(() => {
    setBooting(false);
    setBootReveal((c) => c + 1); // re-key the banner so its glitch-reveal fires
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

  const clear = useCallback(() => setLines([]), []);

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
      startBoot,
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
    startBoot,
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
    complete,
    suggestion,
    isRunning,
    theme,
    setTheme,
    historyPrev,
    historyNext,
    clear,
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
