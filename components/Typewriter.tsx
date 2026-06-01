"use client";

import { useEffect, useRef, useState } from "react";

const CHARS_PER_SEC = 320; // reveal rate
const MAX_DURATION = 1400; // cap so long prose still finishes quickly (ms)

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Reveals `text` character-by-character when `animate` is set, else renders it
 * instantly. Any key/pointer skips to full (armed briefly so the keypress that
 * launched the command can't insta-skip). Animates once on mount; since output
 * lines have stable keys, older blocks never re-animate.
 */
export function Typewriter({ text, animate }: { text: string; animate?: boolean }) {
  const full = text.length;
  // Resolve the instant decision once, at mount.
  const [instant] = useState(() => !animate || prefersReducedMotion());
  const [count, setCount] = useState(instant ? full : 0);
  const doneRef = useRef(instant);

  useEffect(() => {
    if (instant) return;
    const total = Math.min((full / CHARS_PER_SEC) * 1000, MAX_DURATION);
    let raf = 0;
    let start = 0;
    const finish = () => {
      doneRef.current = true;
      setCount(full);
    };
    const step = (t: number) => {
      if (!start) start = t;
      const n =
        total <= 0
          ? full
          : Math.min(full, Math.round(((t - start) / total) * full));
      setCount(n);
      if (n < full) raf = requestAnimationFrame(step);
      else doneRef.current = true;
    };
    raf = requestAnimationFrame(step);

    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 60);
    const onSkip = () => {
      if (armed && !doneRef.current) {
        cancelAnimationFrame(raf);
        finish();
      }
    };
    window.addEventListener("keydown", onSkip);
    window.addEventListener("pointerdown", onSkip);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(armTimer);
      window.removeEventListener("keydown", onSkip);
      window.removeEventListener("pointerdown", onSkip);
    };
  }, [instant, full]);

  return <>{instant ? text : text.slice(0, count)}</>;
}
