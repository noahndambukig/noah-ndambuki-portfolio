"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BANNER_LINE_ID, USER_HOST } from "@/lib/terminal/constants";
import { useTerminal } from "@/lib/terminal/useTerminal";
import { mergeCustomVars } from "@/lib/themes/themes";
import { BootSequence } from "./BootSequence";
import { OutputBlock } from "./OutputBlock";
import { Prompt } from "./Prompt";
import { ThemeEditor } from "./ThemeEditor";

export function Terminal() {
  const term = useTerminal();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const customResolved = useMemo(
    () => mergeCustomVars(term.customVars),
    [term.customVars],
  );

  // Clock renders a stable placeholder on the server + first client paint, then
  // ticks post-mount — no SSR timestamp, so no hydration mismatch.
  const [clock, setClock] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setClock(new Date().toTimeString().slice(0, 8));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [term.lines]);

  // Return focus to the input when nothing else owns it.
  useEffect(() => {
    if (!term.isRunning && !term.customizerOpen && !term.booting) {
      inputRef.current?.focus();
    }
  }, [term.isRunning, term.customizerOpen, term.booting]);

  return (
    <>
      <main
        className="crt"
        inert={term.booting}
        onMouseDown={(e) => {
          if (term.booting) return;
          if (window.getSelection()?.toString()) return;
          if ((e.target as HTMLElement).closest("input, button, a")) return;
          inputRef.current?.focus();
        }}
      >
        <div className="screen">
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
            {term.lines.map((line) => {
              if (line.kind === "input") {
                return (
                  <div key={line.id} className="line line-input">
                    <span className="prompt-ps1">{line.prompt}</span>
                    <span className="line-input-value">{line.value}</span>
                  </div>
                );
              }
              const isBanner = line.id === BANNER_LINE_ID;
              const revealed = isBanner && term.bootReveal > 0;
              return (
                <div
                  key={isBanner ? `${line.id}-${term.bootReveal}` : line.id}
                  className={`line${revealed ? " glitch-reveal" : ""}`}
                >
                  <OutputBlock content={line.content} />
                </div>
              );
            })}

            <Prompt
              value={term.input}
              onChange={term.setInput}
              onSubmit={term.submit}
              onHistoryPrev={term.historyPrev}
              onHistoryNext={term.historyNext}
              onClear={term.clear}
              isRunning={term.isRunning || term.booting}
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

      {term.booting && <BootSequence onComplete={term.completeBoot} />}
    </>
  );
}
