"use client";

import { useEffect, useRef, useState } from "react";
import { USER_HOST } from "@/lib/terminal/constants";

// ---- Tunables -------------------------------------------------------------
const GRID = 21; // logical cells per side (square board)
const SCORE_PER = 10; // points per pellet
const BASE_INTERVAL = 130; // ms per step at the start
const MIN_INTERVAL = 70; // fastest the snake gets
const SPEEDUP_EVERY = 4; // pellets between speed steps
const SPEEDUP_STEP = 8; // ms shaved per speed step
const HI_KEY = "snake.hi";
// Returning from a backgrounded tab hands rAF a huge delta; cap it so the
// accumulator can't burst-process a column of moves and instantly kill the snake.
const MAX_DELTA = 250;
// Board sizing: fill ~88% of the smaller stage dimension, but never exceed this
// so the square stays a tidy retro size (and always fits) on large screens.
const MAX_BOARD = 560;
const FIT_RATIO = 0.88;

type Phase = "idle" | "playing" | "paused" | "over" | "won";
type Vec = { x: number; y: number };

// All mutable per-frame game state. Lives in a ref so the rAF loop never
// triggers React re-renders — only HUD-visible values are mirrored into state.
interface GameState {
  snake: Vec[];
  dir: Vec; // direction committed on the last step
  nextDir: Vec; // direction queued by input for the next step
  food: Vec;
  score: number;
  pellets: number;
  interval: number;
  acc: number; // time accumulator (ms)
  lastTime: number; // timestamp of the previous frame
  phase: Phase;
  rafId: number;
}

function readHi(): number {
  try {
    const v = window.localStorage.getItem(HI_KEY);
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function Snake({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // HUD mirror of the game state (the only values React needs to paint).
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [hi, setHi] = useState(0);

  useEffect(() => {
    setHi(readHi());
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolve theme colors once. Vars live on :root and the theme menu is inert
    // while this overlay is open, so they can't change mid-game.
    const cs = getComputedStyle(document.documentElement);
    const pick = (name: string, fallback: string) =>
      cs.getPropertyValue(name).trim() || fallback;
    const colors = {
      bg: pick("--bg", "#04070a"),
      snake: pick("--accent", "#b6ff3a"),
      food: pick("--united-red-text", "#ff6f61"),
      grid: pick("--fg-dim", "#2f8f63"),
      glow: pick("--glow", "transparent"),
    };

    const g: GameState = {
      snake: [],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 0, y: 0 },
      score: 0,
      pellets: 0,
      interval: BASE_INTERVAL,
      acc: 0,
      lastTime: 0,
      phase: "idle",
      rafId: 0,
    };

    // CSS-pixel size of the (square) canvas; recomputed on resize.
    let cssSize = 0;

    const setPhaseBoth = (p: Phase) => {
      g.phase = p;
      setPhase(p);
    };

    const commitHi = () => {
      if (g.score <= readHi()) return;
      try {
        window.localStorage.setItem(HI_KEY, String(g.score));
      } catch {
        /* private mode / storage disabled — high score just won't persist */
      }
      setHi(g.score);
    };

    const placeFood = () => {
      const occupied = new Set(g.snake.map((s) => s.y * GRID + s.x));
      const empty: number[] = [];
      for (let i = 0; i < GRID * GRID; i++) if (!occupied.has(i)) empty.push(i);
      if (empty.length === 0) {
        // Board full — there's no cell to spawn into. Graceful win, not a hang.
        commitHi();
        setPhaseBoth("won");
        return;
      }
      const idx = empty[Math.floor(Math.random() * empty.length)];
      g.food = { x: idx % GRID, y: Math.floor(idx / GRID) };
    };

    const startGame = () => {
      const cx = Math.floor(GRID / 2);
      const cy = Math.floor(GRID / 2);
      g.snake = [
        { x: cx, y: cy },
        { x: cx - 1, y: cy },
        { x: cx - 2, y: cy },
      ];
      g.dir = { x: 1, y: 0 };
      g.nextDir = { x: 1, y: 0 };
      g.score = 0;
      g.pellets = 0;
      g.interval = BASE_INTERVAL;
      g.acc = 0;
      g.lastTime = 0;
      placeFood();
      setScore(0);
      setPhaseBoth("playing");
    };

    const gameOver = () => {
      commitHi();
      setPhaseBoth("over");
    };

    const step = () => {
      g.dir = g.nextDir; // commit the queued turn exactly once per step
      const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        gameOver();
        return;
      }
      const eating = head.x === g.food.x && head.y === g.food.y;
      // The tail vacates this step unless we're eating, so it isn't a collision.
      const body = eating ? g.snake : g.snake.slice(0, -1);
      if (body.some((s) => s.x === head.x && s.y === head.y)) {
        gameOver();
        return;
      }
      g.snake.unshift(head);
      if (eating) {
        g.score += SCORE_PER;
        g.pellets += 1;
        setScore(g.score);
        if (g.pellets % SPEEDUP_EVERY === 0) {
          g.interval = Math.max(MIN_INTERVAL, g.interval - SPEEDUP_STEP);
        }
        placeFood();
      } else {
        g.snake.pop();
      }
    };

    const steer = (d: Vec) => {
      if (g.phase !== "playing") return;
      // Block a direct 180 into the neck (checked against the committed dir).
      if (d.x === -g.dir.x && d.y === -g.dir.y) return;
      g.nextDir = d;
    };

    const togglePlayPause = () => {
      if (g.phase === "playing") {
        setPhaseBoth("paused");
      } else if (g.phase === "paused") {
        g.lastTime = 0; // resync so the pause gap isn't counted as elapsed time
        setPhaseBoth("playing");
      } else {
        startGame(); // idle / over / won -> (re)start
      }
    };

    const draw = () => {
      if (cssSize <= 0) return;
      const cell = cssSize / GRID;
      const pad = Math.max(1, cell * 0.1);

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, cssSize, cssSize);

      // Faint board frame.
      ctx.strokeStyle = colors.grid;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, cssSize - 1, cssSize - 1);
      ctx.globalAlpha = 1;

      const drawCell = (c: Vec, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(c.x * cell + pad, c.y * cell + pad, cell - pad * 2, cell - pad * 2);
      };

      // Phosphor bloom on the live elements.
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = cell * 0.6;
      if (g.phase !== "idle") {
        drawCell(g.food, colors.food);
        for (const s of g.snake) drawCell(s, colors.snake);
      }
      ctx.shadowBlur = 0;
    };

    const tick = (now: number) => {
      if (g.phase === "playing") {
        if (g.lastTime === 0) g.lastTime = now;
        let delta = now - g.lastTime;
        g.lastTime = now;
        if (delta > MAX_DELTA) delta = g.interval; // clamp post-background burst
        g.acc += delta;
        while (g.acc >= g.interval) {
          g.acc -= g.interval;
          step();
          if (g.phase !== "playing") {
            g.acc = 0;
            break;
          }
        }
      } else {
        g.lastTime = now; // keep the clock current so pauses don't accrue time
        g.acc = 0;
      }
      draw();
      g.rafId = requestAnimationFrame(tick);
    };

    const measure = () => {
      // Largest square that fits the stage, scaled in a bit for margin and
      // capped so it never overflows the viewport or balloons on big screens.
      const rect = stage.getBoundingClientRect();
      const avail = Math.min(rect.width, rect.height);
      const size = Math.floor(Math.min(avail * FIT_RATIO, MAX_BOARD));
      if (size <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS px regardless of dpr
      cssSize = size;
      draw();
    };

    // Single document keydown handler: gameplay keys + Esc + Tab focus-trap.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === " " || e.key === "Spacebar") {
        // Let Space activate the back button if it happens to hold focus.
        if (document.activeElement === backRef.current) return;
        e.preventDefault();
        togglePlayPause();
        return;
      }
      const steers: Record<string, Vec> = {
        arrowup: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        arrowdown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        arrowleft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        arrowright: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const d = steers[e.key.toLowerCase()];
      if (d) {
        e.preventDefault();
        steer(d);
      }
    };

    // Focus the dialog itself (not the back button) so the splash-screen Space
    // starts the game instead of activating a focused back button.
    panelRef.current?.focus();
    document.addEventListener("keydown", onKey);
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    measure();
    g.rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(g.rafId);
      document.removeEventListener("keydown", onKey);
      ro.disconnect();
    };
  }, [onClose]);

  const overlay =
    phase === "idle"
      ? { title: "SNAKE", lines: ["press SPACE to start", "arrows / wasd to steer"] }
      : phase === "paused"
        ? { title: "PAUSED", lines: ["press SPACE to resume"] }
        : phase === "over"
          ? { title: "GAME OVER", lines: [`score ${score} · best ${hi}`, "SPACE retry · ESC quit"] }
          : phase === "won"
            ? { title: "YOU WIN", lines: [`score ${score} · best ${hi}`, "SPACE retry · ESC quit"] }
            : null;

  return (
    <div
      ref={panelRef}
      className="detail"
      role="dialog"
      aria-modal="true"
      aria-label="Snake game"
      tabIndex={-1}
    >
      <header className="detail-bar">
        <span className="detail-crumb">
          {USER_HOST}/<span className="detail-crumb-leaf">snake</span>
        </span>
        <span className="snake-hud" aria-live="off">
          score {score} · best {hi}
        </span>
        <button
          ref={backRef}
          type="button"
          className="detail-back"
          onClick={onClose}
          aria-label="Back to terminal"
        >
          {/* lucide ArrowLeft (inline — no dependency) */}
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        </button>
      </header>

      <div className="snake-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="snake-canvas" />
        {overlay && (
          <div className="snake-overlay" aria-live="polite">
            <div className="snake-overlay-title">{overlay.title}</div>
            {overlay.lines.map((l) => (
              <div key={l} className="snake-overlay-line">
                {l}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
