"use client";

import { useEffect, useRef, useState } from "react";
import { CUSTOM_THEME, THEME_NAMES, THEMES } from "@/lib/themes/themes";

interface ThemeMenuProps {
  /** Currently active theme name. */
  current: string;
  /** Switch to a built-in theme (everything except `custom`). */
  onSelectTheme: (name: string) => void;
  /** Open the custom-color side panel (also activates the custom theme). */
  onOpenCustomizer: () => void;
  /** Resolved custom palette — drives the `custom` entry's preview swatch. */
  customVars: Record<string, string>;
}

/** Two-color preview chip: the theme's text + accent on its own background. */
function Swatch({ vars }: { vars: Record<string, string> }) {
  return (
    <span
      className="theme-menu-swatch"
      style={{ background: vars["--bg"] }}
      aria-hidden="true"
    >
      <i style={{ background: vars["--fg"] }} />
      <i style={{ background: vars["--accent"] }} />
    </span>
  );
}

/**
 * The status-bar theme picker. The button toggles a dropdown of every theme;
 * picking a built-in theme switches instantly, while `custom` opens the editor
 * side panel. (Previously the button opened the panel directly — see Terminal.)
 */
export function ThemeMenu({
  current,
  onSelectTheme,
  onOpenCustomizer,
  customVars,
}: ThemeMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (name: string) => {
    setOpen(false);
    if (name === CUSTOM_THEME) onOpenCustomizer();
    else onSelectTheme(name);
  };

  const builtIns = THEME_NAMES.filter((n) => n !== CUSTOM_THEME);

  const renderItem = (name: string) => {
    const isActive = name === current;
    const vars = name === CUSTOM_THEME ? customVars : THEMES[name].vars;
    return (
      <li key={name} role="none">
        <button
          role="menuitemradio"
          aria-checked={isActive}
          className={`theme-menu-item${isActive ? " is-active" : ""}`}
          type="button"
          onClick={() => choose(name)}
        >
          <span className="theme-menu-mark" aria-hidden="true">
            {isActive ? "▸" : " "}
          </span>
          <Swatch vars={vars} />
          <span className="theme-menu-name">{name}</span>
          {name === CUSTOM_THEME && (
            <span className="theme-menu-tag">edit…</span>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className="theme-menu" ref={rootRef}>
      <button
        className="statusbar-theme"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Choose a color theme"
      >
        theme: {current}
      </button>

      {open && (
        <ul className="theme-menu-list" role="menu" aria-label="Color themes">
          {builtIns.map(renderItem)}
          <li className="theme-menu-divider" role="separator" />
          {renderItem(CUSTOM_THEME)}
        </ul>
      )}
    </div>
  );
}
