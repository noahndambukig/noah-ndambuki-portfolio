"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UNITED_CREST } from "@/lib/content/ascii";
import { BOOT_STEPS, FACT_SLOTS, type BootTag } from "@/lib/content/bootScript";
import { pickFacts } from "@/lib/content/mufc";
import { PROMPT } from "@/lib/terminal/constants";

interface BootLine {
  text: string;
  tag: BootTag;
}

const SPLASH_HOLD = 1100; // crest-only splash time (ms)
const PER_LINE = 230; // delay between log lines (ms)
const TAIL = 600; // pause after last line before handoff (ms)
const REDUCED_HOLD = 700; // static hold under reduced motion before handoff (ms)

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [shown, setShown] = useState<BootLine[]>([]);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  const timers = useRef<number[]>([]);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const containerRef = useRef<HTMLDivElement>(null);

  // Idempotent finish — used by the scheduled end, the skip button, and the
  // global key/pointer skip. Guarded so it only fires once.
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    onCompleteRef.current();
  }, []);

  // Build + schedule the sequence once, on mount.
  useEffect(() => {
    const at = (fn: () => void, t: number) => {
      timers.current.push(window.setTimeout(fn, t));
    };

    // Interleave random [MUFC] facts among the system steps.
    const facts = pickFacts(FACT_SLOTS.length).map(
      (text): BootLine => ({ text, tag: "mufc" }),
    );
    const lines: BootLine[] = [];
    let fi = 0;
    BOOT_STEPS.forEach((s, i) => {
      lines.push({ text: s.text, tag: s.tag ?? "ok" });
      if (FACT_SLOTS.includes(i) && fi < facts.length) lines.push(facts[fi++]);
    });
    while (fi < facts.length) lines.push(facts[fi++]);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Show the full log statically and hold briefly so it is readable.
      setShown(lines);
      setProgress(100);
      at(finish, REDUCED_HOLD);
      return () => timers.current.forEach((id) => window.clearTimeout(id));
    }

    lines.forEach((line, i) => {
      at(() => {
        setShown((prev) => [...prev, line]);
        setProgress(Math.round(((i + 1) / lines.length) * 100));
      }, SPLASH_HOLD + i * PER_LINE);
    });

    const end = SPLASH_HOLD + lines.length * PER_LINE + TAIL;
    at(() => setExiting(true), end - 280); // fade overlay just before handoff
    at(finish, end);

    return () => timers.current.forEach((id) => window.clearTimeout(id));
  }, [finish]);

  // Move focus into the overlay (AT context), and allow skipping on any
  // key/pointer — but ARM the global skip a beat after mount so the keypress that
  // launched the boot (e.g. Enter from the `boot` command) can't instantly dismiss
  // it. Without this, `boot` flashes the overlay away before it can play.
  useEffect(() => {
    containerRef.current?.focus();
    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 450);
    const onSkip = () => {
      if (armed) finish();
    };
    window.addEventListener("keydown", onSkip);
    window.addEventListener("pointerdown", onSkip);
    return () => {
      window.clearTimeout(armTimer);
      window.removeEventListener("keydown", onSkip);
      window.removeEventListener("pointerdown", onSkip);
    };
  }, [finish]);

  return (
    <div
      ref={containerRef}
      className={`boot power-on${exiting ? " boot-exit" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Boot sequence — loading the terminal"
      tabIndex={-1}
    >
      <pre className="boot-crest" aria-hidden="true">
        {UNITED_CREST}
      </pre>

      <div className="boot-log" aria-hidden="true">
        {shown.map((line, i) => (
          <div key={i} className={`boot-line boot-${line.tag}`}>
            <span className="boot-prompt">{PROMPT}</span>
            <span className="boot-text">{line.text}</span>
          </div>
        ))}
      </div>

      <div className="boot-footer">
        <div className="boot-progress" aria-hidden="true">
          <span className="boot-bar" style={{ width: `${progress}%` }} />
        </div>
        <button type="button" className="boot-skip" onClick={finish}>
          press any key or tap to skip
        </button>
      </div>
    </div>
  );
}
