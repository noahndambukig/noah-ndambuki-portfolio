"use client";

import { useEffect, useState } from "react";

// Decode reveal for ASCII art: the block mounts as glyph noise and resolves
// into the real text, row by row with per-character jitter — the same visual
// family as the background's cursor glitch. Whitespace is never scrambled, and
// the noise pool is single-width ASCII, so layout metrics are identical to the
// final text (no shift when a character locks). Renders the finished text
// immediately under prefers-reduced-motion.

const DURATION = 650; // ms until the last row locks
const JITTER = 120; // ms of per-character randomness around its row's lock time
const POOL = "01<>[]{}()/\\|=+*#$%&@!?;:~^";

function scrambleFrame(text: string, lockAt: Float32Array, now: number): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === " " || ch === "\n") out += ch;
    else if (now >= lockAt[i]) out += ch;
    else out += POOL[(Math.random() * POOL.length) | 0];
  }
  return out;
}

export function DecodeAscii({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  const [display, setDisplay] = useState(() => {
    // Client-only component (scrollback lines never SSR), so the first paint
    // can already be noise — no real-text flash before the effect starts.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return text;
    }
    const zero = new Float32Array(text.length).fill(Infinity);
    return scrambleFrame(text, zero, 0);
  });

  useEffect(() => {
    if (display === text) return; // reduced motion (or already settled)

    // Top-down cascade: each character locks with its row, plus jitter.
    const rows = text.split("\n").length;
    const lockAt = new Float32Array(text.length);
    const start = performance.now();
    let row = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "\n") row++;
      lockAt[i] =
        start + ((row + 1) / rows) * (DURATION - JITTER) + Math.random() * JITTER;
    }

    let raf = 0;
    const tick = (now: number) => {
      if (now >= start + DURATION) {
        setDisplay(text);
        return;
      }
      setDisplay(scrambleFrame(text, lockAt, now));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <pre className={className}>{display}</pre>;
}
