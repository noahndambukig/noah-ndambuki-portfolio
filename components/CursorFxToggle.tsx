"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CURSOR_FX_ATTR,
  CURSOR_FX_OFF,
  CURSOR_FX_STORAGE_KEY,
} from "@/lib/settings/cursorFx";

/**
 * Status-bar switch for the cursor-reactive ASCII background, sibling to the
 * theme picker. Reads as a settings line rather than a web toggle — it states its
 * current value the way `theme: crimson` does.
 *
 * Owns its state locally rather than threading through useTerminal, for the same
 * reason Clock does: flipping it must not re-render the terminal (and reconcile
 * the live custom-theme color inputs). The canvas listens on the root attribute.
 */
export function CursorFxToggle() {
  const [on, setOn] = useState(true);

  // Read after mount, not during render: localStorage doesn't exist on the server,
  // and the first client render has to match the server's HTML.
  useEffect(() => {
    try {
      if (localStorage.getItem(CURSOR_FX_STORAGE_KEY) === CURSOR_FX_OFF) setOn(false);
    } catch {
      /* localStorage unavailable — keep the animation on */
    }
  }, []);

  // Side effects stay in the event handler, never inside a setState updater:
  // updaters must be pure (React invokes them at render time, and twice under
  // StrictMode), so writing the attribute there would fire on React's schedule
  // rather than on the click.
  const toggle = useCallback(() => {
    const next = !on;
    const root = document.documentElement;
    if (next) root.removeAttribute(CURSOR_FX_ATTR);
    else root.setAttribute(CURSOR_FX_ATTR, CURSOR_FX_OFF);
    try {
      if (next) localStorage.removeItem(CURSOR_FX_STORAGE_KEY);
      else localStorage.setItem(CURSOR_FX_STORAGE_KEY, CURSOR_FX_OFF);
    } catch {
      /* ignore persistence failure */
    }
    setOn(next);
  }, [on]);

  return (
    <button
      className="statusbar-theme"
      type="button"
      onClick={toggle}
      // Same trick as the prompt's run button: suppressing mousedown keeps focus
      // in the terminal input instead of stealing it for a settings chip.
      onMouseDown={(e) => e.preventDefault()}
      aria-pressed={on}
      aria-label="Cursor animation"
    >
      cursor animation: {on ? "on" : "off"}
    </button>
  );
}
