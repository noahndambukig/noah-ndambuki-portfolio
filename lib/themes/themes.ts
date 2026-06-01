// The ONLY place theme token values live. The SSR default paint, the no-flash
// inline script (app/layout.tsx), and runtime switching (useTheme.ts) all derive
// from this map — so there is no duplicated CSS/JS token table to drift.
//
// Every theme MUST define the same set of keys. `--scanline`, `--grain`, and
// `--curvature` are declared now but unused; the Step-6 CRT overlay reads them.

export interface Theme {
  name: string;
  label: string;
  vars: Record<string, string>;
}

export const THEMES: Record<string, Theme> = {
  matrix: {
    name: "matrix",
    label: "Matrix — elevated phosphor green",
    vars: {
      "--bg": "#04070a",
      "--bg-lift": "#0a140d",
      "--fg": "#5dffa0",
      "--fg-dim": "#2f8f63",
      "--accent": "#b6ff3a",
      "--warn": "#ffb000",
      "--error": "#ff5c57",
      "--success": "#5dffa0",
      "--glow": "rgba(93, 255, 160, 0.55)",
      "--glow-strength": "0.4",
      "--selection": "rgba(93, 255, 160, 0.22)",
      "--scanline": "rgba(0, 0, 0, 0.28)",
      "--grain": "0.04",
      "--curvature": "0",
    },
  },
  amber: {
    name: "amber",
    label: "Amber — vintage mainframe",
    vars: {
      "--bg": "#0a0700",
      "--bg-lift": "#1a1200",
      "--fg": "#ffb454",
      "--fg-dim": "#a6701f",
      "--accent": "#ffd479",
      "--warn": "#ff9f1c",
      "--error": "#ff5c57",
      "--success": "#ffd479",
      "--glow": "rgba(255, 180, 84, 0.5)",
      "--glow-strength": "0.4",
      "--selection": "rgba(255, 180, 84, 0.22)",
      "--scanline": "rgba(0, 0, 0, 0.3)",
      "--grain": "0.045",
      "--curvature": "0",
    },
  },
  dracula: {
    name: "dracula",
    label: "Dracula — modern dark",
    vars: {
      "--bg": "#21222c",
      "--bg-lift": "#2b2d3a",
      "--fg": "#f8f8f2",
      "--fg-dim": "#6272a4",
      "--accent": "#bd93f9",
      "--warn": "#f1fa8c",
      "--error": "#ff5555",
      "--success": "#50fa7b",
      "--glow": "rgba(189, 147, 249, 0.32)",
      "--glow-strength": "0.3",
      "--selection": "rgba(189, 147, 249, 0.3)",
      "--scanline": "rgba(0, 0, 0, 0.22)",
      "--grain": "0.03",
      "--curvature": "0",
    },
  },
  "tokyo-night": {
    name: "tokyo-night",
    label: "Tokyo Night — muted cyan",
    vars: {
      "--bg": "#1a1b26",
      "--bg-lift": "#24283b",
      "--fg": "#c0caf5",
      "--fg-dim": "#565f89",
      "--accent": "#7dcfff",
      "--warn": "#e0af68",
      "--error": "#f7768e",
      "--success": "#9ece6a",
      "--glow": "rgba(125, 207, 255, 0.3)",
      "--glow-strength": "0.28",
      "--selection": "rgba(122, 162, 247, 0.3)",
      "--scanline": "rgba(0, 0, 0, 0.22)",
      "--grain": "0.03",
      "--curvature": "0",
    },
  },
  crimson: {
    name: "crimson",
    label: "Crimson — black & red",
    vars: {
      "--bg": "#000000",
      "--bg-lift": "#190709",
      "--fg": "#a70000",
      "--fg-dim": "#9b3636",
      "--accent": "#ff7849",
      "--warn": "#ffb000",
      "--error": "#ff2e2e",
      "--success": "#ff8a7a",
      "--glow": "rgba(255, 77, 77, 0.5)",
      "--glow-strength": "0.4",
      "--selection": "rgba(255, 77, 77, 0.22)",
      "--scanline": "rgba(0, 0, 0, 0.3)",
      "--grain": "0.045",
      "--curvature": "0",
    },
  },
  // User-personalized theme. These are only the BASE/default values (a clone of
  // matrix). The live palette is base ⊕ the user's stored overrides, resolved by
  // mergeCustomVars(). --glow/--selection here are placeholders; they are always
  // re-derived from the resolved --fg.
  custom: {
    name: "custom",
    label: "Custom — your colors",
    vars: {
      "--bg": "#04070a",
      "--bg-lift": "#0a140d",
      "--fg": "#5dffa0",
      "--fg-dim": "#2f8f63",
      "--accent": "#b6ff3a",
      "--warn": "#ffb000",
      "--error": "#ff5c57",
      "--success": "#5dffa0",
      "--glow": "rgba(93, 255, 160, 0.55)",
      "--glow-strength": "0.4",
      "--selection": "rgba(93, 255, 160, 0.22)",
      "--scanline": "rgba(0, 0, 0, 0.28)",
      "--grain": "0.04",
      "--curvature": "0",
    },
  },
};

export const DEFAULT_THEME = "crimson";
export const CUSTOM_THEME = "custom";
export const CUSTOM_STORAGE_KEY = "term-theme-custom";

// Alpha used when deriving --glow / --selection from --fg. Kept in sync with the
// no-flash script in app/layout.tsx.
export const GLOW_ALPHA = 0.5;
export const SELECTION_ALPHA = 0.22;

// The color tokens exposed in the custom-theme picker. Native color inputs are
// hex-only, so only #RRGGBB tokens are editable; everything else is derived or
// left at base.
export const EDITABLE_TOKENS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "--bg", label: "Background" },
  { key: "--bg-lift", label: "Background glow" },
  { key: "--fg", label: "Text" },
  { key: "--fg-dim", label: "Dim text" },
  { key: "--accent", label: "Accent" },
  { key: "--warn", label: "Warning" },
  { key: "--error", label: "Error" },
  { key: "--success", label: "Success" },
];

const EDITABLE_KEYS = new Set(EDITABLE_TOKENS.map((t) => t.key));
const HEX6 = /^#[0-9a-fA-F]{6}$/;

/** True for a strict `#RRGGBB` color string. */
export function isHex6(value: unknown): value is string {
  return typeof value === "string" && HEX6.test(value);
}

/** Convert `#RRGGBB` to an `rgba(...)` string; falls back to white on bad input. */
export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (!m) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Keep only valid editable hex overrides from an untrusted object. */
export function sanitizeCustomOverrides(
  input: unknown,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    for (const { key } of EDITABLE_TOKENS) {
      if (isHex6(obj[key])) out[key] = obj[key] as string;
    }
  }
  return out;
}

/**
 * Resolve the live custom palette: base custom vars, overlaid with whitelisted +
 * validated overrides, with --glow / --selection always re-derived from the
 * resolved --fg. Anything not in EDITABLE_KEYS is ignored.
 */
export function mergeCustomVars(
  overrides: Record<string, string> | null | undefined,
): Record<string, string> {
  const vars = { ...THEMES[CUSTOM_THEME].vars };
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (EDITABLE_KEYS.has(key) && isHex6(value)) vars[key] = value;
    }
  }
  vars["--glow"] = hexToRgba(vars["--fg"], GLOW_ALPHA);
  vars["--selection"] = hexToRgba(vars["--fg"], SELECTION_ALPHA);
  return vars;
}

/** The editable hex tokens of a named theme — used to seed the custom theme. */
export function editableVarsOf(themeName: string): Record<string, string> {
  const src = (THEMES[themeName] ?? THEMES[DEFAULT_THEME]).vars;
  const out: Record<string, string> = {};
  for (const { key } of EDITABLE_TOKENS) {
    if (isHex6(src[key])) out[key] = src[key];
  }
  return out;
}
export const STORAGE_KEY = "term-theme";
export const THEME_NAMES = Object.keys(THEMES);

export function isTheme(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(THEMES, name);
}

/** Serialize a theme's vars to a CSS declaration string (`--a:1;--b:2`). */
export function varsToCss(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
