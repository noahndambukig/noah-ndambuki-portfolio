"use client";

import { useEffect, useRef, useState } from "react";
import { EDITABLE_TOKENS, isHex6 } from "@/lib/themes/themes";

interface ThemeEditorProps {
  open: boolean;
  /** Resolved custom palette (base ⊕ overrides) — provides each token's value. */
  vars: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  onClose: () => void;
}

function normalizeHex(raw: string): string {
  const trimmed = raw.trim();
  return (trimmed.startsWith("#") ? trimmed : `#${trimmed}`).toLowerCase();
}

/**
 * A single token row: dim label · color well (OS color wheel) · hex field.
 * The hex field keeps a local DRAFT so partial input (e.g. "#12") never corrupts
 * theme state — it only commits when the value is a valid #RRGGBB.
 */
function ColorRow({
  token,
  label,
  value,
  onCommit,
}: {
  token: string;
  label: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  // Sync the draft when the value changes externally (well, reset, fg-derive).
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commitIfValid = (raw: string) => {
    const norm = normalizeHex(raw);
    if (isHex6(norm)) onCommit(norm);
  };

  const wellValue = isHex6(value) ? value : "#000000";

  return (
    <div className="editor-row">
      <label className="editor-label" htmlFor={`well-${token}`}>
        {label}
      </label>
      <input
        id={`well-${token}`}
        className="editor-well"
        type="color"
        value={wellValue}
        onChange={(e) => onCommit(e.target.value)}
        aria-label={`${label} color wheel`}
      />
      <input
        className="editor-hex"
        type="text"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        value={draft}
        aria-label={`${label} hex value`}
        onChange={(e) => {
          setDraft(e.target.value);
          commitIfValid(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commitIfValid(draft);
            (e.target as HTMLInputElement).blur();
          }
        }}
        onBlur={() => {
          if (isHex6(normalizeHex(draft))) commitIfValid(draft);
          else setDraft(value); // revert an incomplete draft
        }}
      />
    </div>
  );
}

export function ThemeEditor({
  open,
  vars,
  onChange,
  onReset,
  onClose,
}: ThemeEditorProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="editor-scrim" onMouseDown={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        className="theme-editor"
        role="dialog"
        aria-label="Custom theme color picker"
        tabIndex={-1}
      >
        <header className="editor-header">
          <span className="editor-title">┌─ theme.custom ─┐</span>
          <button
            className="editor-x"
            type="button"
            onClick={onClose}
            aria-label="Close color picker"
          >
            [esc]
          </button>
        </header>

        <div className="editor-rows">
          {EDITABLE_TOKENS.map((t) => (
            <ColorRow
              key={t.key}
              token={t.key}
              label={t.label}
              value={vars[t.key] ?? "#000000"}
              onCommit={(v) => onChange(t.key, v)}
            />
          ))}
        </div>

        <footer className="editor-footer">
          <span className="editor-note">changes save automatically</span>
          <span className="editor-actions">
            <button className="editor-btn" type="button" onClick={onReset}>
              reset
            </button>
            <button className="editor-btn" type="button" onClick={onClose}>
              close
            </button>
          </span>
        </footer>
      </aside>
    </>
  );
}
