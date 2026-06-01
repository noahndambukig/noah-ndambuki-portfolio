"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { USER_HOST } from "@/lib/terminal/constants";
import { useTerminal } from "@/lib/terminal/useTerminal";
import { mergeCustomVars } from "@/lib/themes/themes";
import { OutputBlock } from "./OutputBlock";
import { Prompt } from "./Prompt";
import { ThemeEditor } from "./ThemeEditor";

export function Terminal() {
  const term = useTerminal();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Resolved custom palette for the editor's wells/hex fields.
  const customResolved = useMemo(
    () => mergeCustomVars(term.customVars),
    [term.customVars],
  );

  // Clock renders a stable placeholder on the server + first client paint, then
  // starts ticking post-mount — no SSR timestamp, so no hydration mismatch.
  const [clock, setClock] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setClock(new Date().toTimeString().slice(0, 8));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Keep the newest output in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [term.lines]);

  // Return focus to the input when a command finishes or the picker closes.
  useEffect(() => {
    if (!term.isRunning && !term.customizerOpen) inputRef.current?.focus();
  }, [term.isRunning, term.customizerOpen]);

  return (
    <>
      <main
        className="crt"
        onMouseDown={(e) => {
          // Don't steal focus from interactive controls or while selecting text.
          if (window.getSelection()?.toString()) return;
          if ((e.target as HTMLElement).closest("input, button, a")) return;
          inputRef.current?.focus();
        }}
      >
        <div className="screen power-on">
          <header className="statusbar">
            <span className="statusbar-host">{USER_HOST}</span>
            <button
              className="statusbar-theme"
              type="button"
              onClick={term.openCustomizer}
              aria-label="Open the custom theme color picker"
            >
              theme: {term.theme}
            </button>
            <span className="statusbar-clock" suppressHydrationWarning>
              {clock ?? "--:--:--"}
            </span>
          </header>

          <div className="scrollback" ref={scrollRef}>
            {term.lines.map((line) =>
              line.kind === "input" ? (
                <div key={line.id} className="line line-input">
                  <span className="prompt-ps1">{line.prompt}</span>
                  <span className="line-input-value">{line.value}</span>
                </div>
              ) : (
                <div key={line.id} className="line">
                  <OutputBlock content={line.content} />
                </div>
              ),
            )}

            <Prompt
              value={term.input}
              onChange={term.setInput}
              onSubmit={term.submit}
              onHistoryPrev={term.historyPrev}
              onHistoryNext={term.historyNext}
              onClear={term.clear}
              isRunning={term.isRunning}
              inputRef={inputRef}
            />
          </div>

          <footer className="hint">type &apos;help&apos; to begin</footer>
          <div className="vignette" aria-hidden="true" />
        </div>
      </main>

      <ThemeEditor
        open={term.customizerOpen}
        vars={customResolved}
        onChange={term.setCustomVar}
        onReset={term.resetCustom}
        onClose={term.closeCustomizer}
      />
    </>
  );
}
