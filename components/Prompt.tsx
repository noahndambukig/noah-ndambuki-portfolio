"use client";

import type { KeyboardEvent, RefObject } from "react";
import { PROMPT } from "@/lib/terminal/constants";

interface PromptProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onComplete: () => void;
  onHistoryPrev: () => void;
  onHistoryNext: () => void;
  onClear: () => void;
  isRunning: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function Prompt({
  value,
  onChange,
  onSubmit,
  onComplete,
  onHistoryPrev,
  onHistoryNext,
  onClear,
  isRunning,
  inputRef,
}: PromptProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onHistoryPrev();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onHistoryNext();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      onClear();
    } else if (e.key === "Tab") {
      e.preventDefault();
      onComplete();
    }
  };

  return (
    <div className="prompt-line">
      <span className="prompt-ps1">{PROMPT}</span>
      <span className="prompt-field">
        <input
          ref={inputRef}
          className="prompt-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isRunning}
          aria-label="terminal input"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        {/* Block caret. Monospace makes a `ch`-offset reliable; the real input
            above keeps the caret transparent and owns focus/selection. */}
        <span
          className="prompt-caret"
          style={{ left: `${value.length}ch` }}
          data-running={isRunning || undefined}
          aria-hidden="true"
        />
      </span>
    </div>
  );
}
