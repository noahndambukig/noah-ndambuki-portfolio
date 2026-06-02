"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { projects } from "@/lib/content/projects";
import { BANNER_LINE_ID, USER_HOST } from "@/lib/terminal/constants";
import { useTerminal } from "@/lib/terminal/useTerminal";
import { mergeCustomVars } from "@/lib/themes/themes";
import { BootSequence } from "./BootSequence";
import { Clock } from "./Clock";
import { OutputBlock } from "./OutputBlock";
import { ProjectDetail } from "./ProjectDetail";
import { Prompt } from "./Prompt";
import { Snake } from "./Snake";
import { TerminalActionsContext } from "./TerminalActions";
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

  const detailOpen = term.view.kind === "project";
  const snakeOpen = term.view.kind === "snake";
  // Any full-screen view that takes over focus + makes the terminal inert.
  const overlayOpen = detailOpen || snakeOpen;
  const activeProject = useMemo(() => {
    const v = term.view;
    return v.kind === "project" ? projects.find((p) => p.slug === v.slug) : undefined;
  }, [term.view]);
  // Focus the input and drop the caret at the very end. Used by both the card
  // paste below and the focus-restore effect, so the native caret and the custom
  // block caret (pinned at value.length) always agree, whatever path took focus.
  const focusInputAtEnd = useCallback(() => {
    const el = inputRef.current;
    if (!el || el.disabled) return;
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }, []);

  // A polite live-region message so screen-reader users learn a card click only
  // STAGES a command (sighted users see it populate the always-visible prompt).
  const [staged, setStaged] = useState("");

  // Clicking a card pastes its command into the prompt (it does NOT auto-run) —
  // the visitor then presses Enter. This intentionally REPLACES any half-typed
  // input (like picking from a command palette) and resets history navigation.
  // We focus + caret-to-end after React commits the new value.
  const fillCommand = useCallback(
    (command: string) => {
      term.setInput(command);
      setStaged(command);
      requestAnimationFrame(focusInputAtEnd);
    },
    [term.setInput, focusInputAtEnd],
  );
  const actions = useMemo(() => ({ fillCommand }), [fillCommand]);

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

  // Return focus to the input when nothing else owns it (also restores focus when
  // a project detail view closes). Caret-to-end keeps it consistent if a card was
  // clicked while a command was running (the input was disabled at paste time).
  useEffect(() => {
    if (!term.isRunning && !term.customizerOpen && !term.booting && !overlayOpen) {
      focusInputAtEnd();
    }
  }, [term.isRunning, term.customizerOpen, term.booting, overlayOpen, focusInputAtEnd]);

  // Tab from anywhere snaps focus back into the input — the terminal's one text
  // field. When the input already holds focus we let it fall through to the
  // Prompt's own Tab handler (autocomplete). Skip while a modal/overlay owns
  // focus (theme editor, project detail) or while the input is disabled.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (term.isRunning || term.booting || term.customizerOpen || overlayOpen) return;
      if (document.activeElement === inputRef.current) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [term.isRunning, term.booting, term.customizerOpen, overlayOpen]);

  return (
    <TerminalActionsContext.Provider value={actions}>
      <main
        className="crt"
        inert={term.booting || overlayOpen}
        onMouseDown={(e) => {
          if (term.booting || overlayOpen) return;
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
            <Clock />
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
              </div>
            </div>
          </div>

          {/* Persistent, bordered input — pinned below the scrollback so it's
              always visible (it no longer scrolls away with the output). */}
          <div className="prompt-box">
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

          <footer className="hint">
            <span className="hint-tab">
              <kbd>tab</kbd> focus
            </span>
            <span className="hint-help">type &apos;help&apos; to begin</span>
          </footer>
          <div className="sr-only" role="status" aria-live="polite">
            {staged ? `Staged ${staged}. Press Enter to run.` : ""}
          </div>
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

      {detailOpen && activeProject && (
        <ProjectDetail project={activeProject} onClose={term.closeView} />
      )}

      {snakeOpen && <Snake onClose={term.closeView} />}
    </TerminalActionsContext.Provider>
  );
}
