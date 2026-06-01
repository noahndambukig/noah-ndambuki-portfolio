"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BANNER_LINE_ID, USER_HOST } from "@/lib/terminal/constants";
import { useTerminal } from "@/lib/terminal/useTerminal";
import { mergeCustomVars } from "@/lib/themes/themes";
import { BootSequence } from "./BootSequence";
import { OutputBlock } from "./OutputBlock";
import { Prompt } from "./Prompt";
import { ThemeEditor } from "./ThemeEditor";
import { ThemeMenu } from "./ThemeMenu";

export function Terminal() {
  const term = useTerminal();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);

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

  // Track whether the user is at the bottom, so growth doesn't yank them down
  // when they've scrolled up to read.
  const onScroll = () => {
    const el = scrollRef.current;
    if (el) {
      nearBottomRef.current = el.scrollHeight - el.clientHeight - el.scrollTop < 40;
    }
  };

  // Pin the view to the bottom as content grows — including while the typewriter
  // reveals text. The scroller has a fixed height, so observe the inner content
  // wrapper (whose height actually changes), not the scroller itself.
  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const toBottom = () => {
      scroller.scrollTop = scroller.scrollHeight;
    };
    toBottom();
    const ro = new ResizeObserver(() => {
      if (nearBottomRef.current) toBottom();
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

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
            <ThemeMenu
              current={term.theme}
              onSelectTheme={term.setTheme}
              onOpenCustomizer={term.openCustomizer}
              customVars={customResolved}
            />
            <span className="statusbar-clock" suppressHydrationWarning>
              {clock ?? "--:--:--"}
            </span>
          </header>

          <div className="scroll-clip">
            <div className="scrollback" ref={scrollRef} onScroll={onScroll}>
              <div className="scrollback-content" ref={contentRef}>
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
                  suggestion={term.suggestion}
                  onChange={term.setInput}
                  onSubmit={term.submit}
                  onComplete={term.complete}
                  onHistoryPrev={term.historyPrev}
                  onHistoryNext={term.historyNext}
                  onClear={term.clear}
                  isRunning={term.isRunning || term.booting}
                  inputRef={inputRef}
                />
              </div>
            </div>
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
