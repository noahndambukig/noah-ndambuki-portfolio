"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CUSTOM_STORAGE_KEY,
  CUSTOM_THEME,
  DEFAULT_THEME,
  editableVarsOf,
  isHex6,
  isTheme,
  mergeCustomVars,
  sanitizeCustomOverrides,
  STORAGE_KEY,
  THEMES,
} from "./themes";

function applyVars(vars: Record<string, string>, name: string): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute("data-theme", name);
}

function readStoredOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return {};
    return sanitizeCustomOverrides(JSON.parse(raw));
  } catch {
    return {};
  }
}

function persistOverrides(overrides: Record<string, string>): void {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore persistence failure */
  }
}

/**
 * Active theme + the custom theme's editable overrides. The CSS tokens for the
 * initial paint are already applied by the no-flash script in layout.tsx; this
 * hook owns runtime switching and live custom-color edits.
 *
 * `customVars` holds ONLY the editable hex overrides; --glow/--selection are
 * always derived from the resolved --fg by mergeCustomVars().
 */
export function useTheme() {
  const [theme, setThemeState] = useState<string>(DEFAULT_THEME);
  const [customVars, setCustomVarsState] = useState<Record<string, string>>({});

  // Latest-value refs so callbacks stay stable without stale closures.
  const themeRef = useRef(theme);
  const customRef = useRef(customVars);
  themeRef.current = theme;
  customRef.current = customVars;

  useEffect(() => {
    const overrides = readStoredOverrides();
    if (Object.keys(overrides).length) {
      customRef.current = overrides;
      setCustomVarsState(overrides);
    }
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEY);
      if (storedTheme && isTheme(storedTheme)) setThemeState(storedTheme);
    } catch {
      /* localStorage unavailable — keep default */
    }
  }, []);

  const setTheme = useCallback((name: string): boolean => {
    if (!isTheme(name)) return false;
    const vars =
      name === CUSTOM_THEME
        ? mergeCustomVars(customRef.current)
        : THEMES[name].vars;
    applyVars(vars, name);
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      /* ignore */
    }
    setThemeState(name);
    return true;
  }, []);

  const setCustomVar = useCallback((key: string, value: string) => {
    if (!isHex6(value)) return;
    const next = { ...customRef.current, [key]: value };
    customRef.current = next;
    setCustomVarsState(next);
    persistOverrides(next);
    if (themeRef.current === CUSTOM_THEME) {
      applyVars(mergeCustomVars(next), CUSTOM_THEME);
    }
  }, []);

  const resetCustom = useCallback(() => {
    customRef.current = {};
    setCustomVarsState({});
    try {
      localStorage.removeItem(CUSTOM_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (themeRef.current === CUSTOM_THEME) {
      applyVars(mergeCustomVars({}), CUSTOM_THEME);
    }
  }, []);

  /** Copy a theme's editable hex tokens into the custom overrides (and persist). */
  const seedCustomFrom = useCallback((themeName: string) => {
    const seeded = editableVarsOf(
      themeName === CUSTOM_THEME ? DEFAULT_THEME : themeName,
    );
    customRef.current = seeded;
    setCustomVarsState(seeded);
    persistOverrides(seeded);
  }, []);

  const hasCustomOverrides = useCallback(
    () => Object.keys(customRef.current).length > 0,
    [],
  );

  return {
    theme,
    setTheme,
    customVars,
    setCustomVar,
    resetCustom,
    seedCustomFrom,
    hasCustomOverrides,
  };
}
