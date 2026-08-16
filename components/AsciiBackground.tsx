"use client";

import { useEffect, useRef } from "react";

// ASCII cursor-reveal background. The viewport is tiled with a grid of faint
// monospace glyphs (paper texture, not content). The cursor is the only light
// source: nearby glyphs brighten with eased distance falloff, and an inner core
// continuously scrambles its characters in the accent color. Lit cells don't
// snap off — they decay like CRT phosphor (~250ms), so the cursor drags a
// fading trail and the field "heals" behind it. A soft radial haze div under
// the canvas gives the light bloom without touching canvas pixels.
//
// Pure canvas + one div, no deps. Sits behind all content (zIndex:-1,
// pointer-events:none), reads --fg/--accent from the live theme so it recolors
// on theme switch. Under prefers-reduced-motion it renders the static field
// only. The rAF loop is fully stopped while idle (zero callbacks).
//
// Perf model: the resting field is painted once. Each frame clears and
// repaints only the active (lit) cells — cost is proportional to the trail,
// independent of viewport size.

// Tunables — adjust to taste.
const FONT_SIZE = 13; // px glyph size
const LINE = 1.4; // row height multiplier (cellH = FONT_SIZE * LINE)
// Resting visibility is a perceived-brightness target, not a fixed alpha: a
// bright-green --fg at 5% alpha reads loud while a dark red vanishes. The
// resting alpha is derived per theme as BASE_TARGET / luminance(--fg), clamped.
const BASE_TARGET = 0.01; // perceived resting brightness (alpha * luma)
const BASE_MIN = 0.008, BASE_MAX = 0.09; // alpha clamp for extreme fg colors
const PEAK_ALPHA = 0.85; // opacity at the cursor's exact position
const FALLOFF = 1.7; // >1 tightens the bright core, softens the edge
const GLOW_CELLS = 7; // illumination radius, in rows
const GLITCH_CELLS = 3; // scramble radius, in rows
const CORE_ENERGY = 0.7; // min energy inside the scramble core (keeps it hot)
const FLIP_MIN = 45; // ms a scrambled glyph holds before re-rolling
const FLIP_MAX = 190;
const TAU = 0.25; // s — phosphor decay time constant
const EPS = 0.02; // energy below this = healed, cell leaves the active set
const PULSE_MS = 350; // touch tap: how long the burst keeps injecting
const HAZE_TARGET = 0.008; // perceived bloom brightness (luma-scaled like BASE)
const HAZE_MIN = 0.01, HAZE_MAX = 0.08;
const HAZE_SCALE = 2.6; // haze diameter = glow radius * this

// Weighted glyph set: mostly quiet punctuation with sparser "loud" hex/code
// glyphs, so the field has rhythm instead of uniform noise. The scramble core
// rolls from the loud set only — that is where the hacker shimmer lives.
const QUIET = ".:·'-";
const LOUD = "0123456789abcdef[]{}<>/\\|+*#$%&@;~";
const CHARS = (QUIET.repeat(10) + LOUD).split("");
const SCRAMBLE = LOUD.split("");

// Parse "#rrggbb"/"#rgb" -> {rgb: "r, g, b", luma: 0..1}. Phosphor-green
// fallback for the brief window before theme tokens are applied.
function parseColor(hex: string): { rgb: string; luma: number } {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  let r = 51, g = 255, b = 102;
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
    const n = parseInt(h, 16);
    r = (n >> 16) & 255;
    g = (n >> 8) & 255;
    b = n & 255;
  }
  return {
    rgb: `${r}, ${g}, ${b}`,
    luma: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255,
  };
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export function AsciiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hazeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const haze = hazeRef.current;
    if (!canvas || !haze) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1;
    let cols = 0, rows = 0, cellW = 0, cellH = 0, pad = 0;
    let glowR = 0, glitchR = 0, hazeSize = 0;
    let field = new Uint8Array(0); // stable glyph index per cell
    let energy = new Float32Array(0); // 0..1 light level per cell
    const active = new Set<number>(); // cells currently above resting alpha
    // Scramble state per cell: displayed loud-glyph index + next re-roll time.
    const flipChar = new Map<number, number>();
    const flipAt = new Map<number, number>();

    const readVar = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name);
    let fgRgb = "", accentRgb = "", baseAlpha = 0, hazeAlpha = 0;
    const recolor = () => {
      const fg = parseColor(readVar("--fg"));
      fgRgb = fg.rgb;
      accentRgb = parseColor(readVar("--accent")).rgb;
      // Luma-adaptive faintness: constant perceived brightness across themes.
      const luma = Math.max(0.05, fg.luma);
      baseAlpha = clamp(BASE_TARGET / luma, BASE_MIN, BASE_MAX);
      hazeAlpha = clamp(HAZE_TARGET / luma, HAZE_MIN, HAZE_MAX);
    };
    recolor();

    const mouse = { x: -9999, y: -9999, active: false };
    let pulseX = 0, pulseY = 0, pulseUntil = 0;
    let raf = 0, running = false, last = 0, disposed = false;

    const setFont = () => {
      const family = getComputedStyle(document.body).fontFamily || "monospace";
      ctx.font = `${FONT_SIZE}px ${family}`;
      ctx.textBaseline = "top";
    };

    const paintCell = (i: number, ch: string, alpha: number, rgb: string) => {
      const c = i % cols, r = (i / cols) | 0;
      ctx.clearRect(c * cellW, r * cellH, cellW, cellH);
      ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
      ctx.fillText(ch, c * cellW, r * cellH + pad);
    };

    const paintAll = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = `rgba(${fgRgb}, ${baseAlpha})`;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillText(CHARS[field[r * cols + c]], c * cellW, r * cellH + pad);
        }
      }
    };

    const styleHaze = () => {
      haze.style.width = `${hazeSize}px`;
      haze.style.height = `${hazeSize}px`;
      haze.style.background =
        `radial-gradient(circle, rgba(${fgRgb}, ${hazeAlpha}) 0%, ` +
        `rgba(${fgRgb}, ${hazeAlpha * 0.4}) 40%, transparent 70%)`;
    };

    const moveHaze = (x: number, y: number) => {
      haze.style.transform =
        `translate3d(${x - hazeSize / 2}px, ${y - hazeSize / 2}px, 0)`;
      haze.style.opacity = "1";
    };

    // Raise energy (and roll scramble glyphs) for every cell the light reaches.
    const injectAt = (x: number, y: number, now: number) => {
      const dc = Math.ceil(glowR / cellW), dr = Math.ceil(glowR / cellH);
      const mc = Math.floor(x / cellW), mr = Math.floor(y / cellH);
      const r0 = Math.max(0, mr - dr), r1 = Math.min(rows - 1, mr + dr);
      const c0 = Math.max(0, mc - dc), c1 = Math.min(cols - 1, mc + dc);
      for (let r = r0; r <= r1; r++) {
        const dy = r * cellH + cellH / 2 - y;
        for (let c = c0; c <= c1; c++) {
          const dx = c * cellW + cellW / 2 - x;
          const d = Math.hypot(dx, dy);
          if (d >= glowR) continue;
          let e = Math.pow(1 - d / glowR, FALLOFF);
          const i = r * cols + c;
          if (d < glitchR) {
            if (e < CORE_ENERGY) e = CORE_ENERGY;
            const due = flipAt.get(i);
            if (due === undefined || now >= due) {
              flipChar.set(i, (Math.random() * SCRAMBLE.length) | 0);
              flipAt.set(i, now + FLIP_MIN + Math.random() * (FLIP_MAX - FLIP_MIN));
            }
          }
          if (e > energy[i]) energy[i] = e;
          active.add(i);
        }
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const pulsing = now < pulseUntil;
      if (mouse.active) injectAt(mouse.x, mouse.y, now);
      else if (pulsing) injectAt(pulseX, pulseY, now);

      const decay = Math.exp(-dt / TAU);
      for (const i of active) {
        const en = energy[i];
        if (en <= EPS) {
          // Healed: restore the stable resting glyph and forget the scramble.
          energy[i] = 0;
          active.delete(i);
          flipChar.delete(i);
          flipAt.delete(i);
          paintCell(i, CHARS[field[i]], baseAlpha, fgRgb);
          continue;
        }
        const alpha = baseAlpha + (PEAK_ALPHA - baseAlpha) * en;
        const scr = flipChar.get(i);
        // Scrambled cells keep their glitched glyph + accent color while they
        // fade, then snap back to the field glyph on heal.
        if (scr !== undefined) paintCell(i, SCRAMBLE[scr], alpha, accentRgb);
        else paintCell(i, CHARS[field[i]], alpha, fgRgb);
        energy[i] = en * decay;
      }

      if (mouse.active || pulsing || active.size > 0) {
        raf = requestAnimationFrame(loop);
      } else {
        running = false; // idle: no callbacks until an event restarts us
        haze.style.opacity = "0";
      }
    };

    const ensureRunning = () => {
      if (reduced || running || disposed) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setFont(); // canvas resize resets context state — re-apply after

      // Integer cell metrics: fractional boxes make clearRect shave neighboring
      // glyphs' antialiased fringe on every heal. Whole pixels = exact erasure.
      cellW = Math.max(4, Math.round(ctx.measureText("0").width));
      cellH = Math.round(FONT_SIZE * LINE);
      pad = (cellH - FONT_SIZE) / 2;
      cols = Math.ceil(w / cellW);
      rows = Math.ceil(h / cellH);
      glowR = GLOW_CELLS * cellH;
      glitchR = GLITCH_CELLS * cellH;
      hazeSize = Math.round(glowR * HAZE_SCALE);

      field = new Uint8Array(cols * rows);
      for (let i = 0; i < field.length; i++) {
        field[i] = (Math.random() * CHARS.length) | 0;
      }
      energy = new Float32Array(cols * rows);
      active.clear();
      flipChar.clear();
      flipAt.clear();

      styleHaze();
      paintAll();
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      moveHaze(e.clientX, e.clientY);
      ensureRunning();
    };
    // Touch has no hover: a tap fires a one-shot burst that the same decay
    // pipeline fades out. Mouse users already have the cursor — no pulse.
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      pulseX = e.clientX;
      pulseY = e.clientY;
      pulseUntil = performance.now() + PULSE_MS;
      moveHaze(e.clientX, e.clientY);
      ensureRunning();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") mouse.active = false;
    };
    const onLeave = () => {
      mouse.active = false;
      haze.style.opacity = "0";
    };

    // Theme switch: CSS vars can't recolor rasterized pixels — full repaint
    // (this path also serves reduced-motion, which has no loop to catch it).
    const obs = new MutationObserver(() => {
      recolor();
      styleHaze();
      paintAll();
    });

    setup();
    // The web font lands after first paint and changes cell metrics — redo.
    document.fonts?.ready.then(() => {
      if (!disposed) setup();
    }).catch(() => {});
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });
    window.addEventListener("resize", setup);
    if (!reduced) {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      window.addEventListener("pointerleave", onLeave);
      window.addEventListener("blur", onLeave);
    } else {
      haze.style.display = "none";
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener("resize", setup);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return (
    <>
      {/* Bloom layer: transform/opacity only (compositor-friendly), self-erasing. */}
      <div
        ref={hazeRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: -1,
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 400ms ease",
          willChange: "transform, opacity",
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
      />
    </>
  );
}
