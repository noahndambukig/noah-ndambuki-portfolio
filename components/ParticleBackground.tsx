"use client";

import { useEffect, useRef } from "react";

// Drift background: a field of free-floating dots in constant slow motion. The
// whole field animates on its own; the cursor pushes nearby dots away and makes
// them flare. Pure canvas, no dependencies. Sits behind all content
// (zIndex:-1, pointer-events:none) and reads the active theme's --fg token so it
// recolors on theme switch. Renders one static frame under
// prefers-reduced-motion.

// Tunables — adjust to taste.
const DENSITY = 2600; // lower = more dots (one dot per ~N px²)
const BASE_ALPHA = 0.4; // resting dot opacity
const MAX_SPEED = 14; // px/s drift speed range (±)
const INFLUENCE = 130; // px cursor reach
const REPEL = 45; // px/s outward shove at the cursor

// Parse "#rrggbb"/"#rgb" -> "r, g, b" for rgba(). Phosphor-green fallback for
// the brief window before theme tokens are applied.
function toRgb(hex: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "51, 255, 102";
  let h = m[1];
  if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

type Dot = { x: number; y: number; vx: number; vy: number; r: number };

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1;
    let dots: Dot[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let rgb = toRgb(getComputedStyle(document.documentElement).getPropertyValue("--fg"));

    const seed = () => {
      const n = Math.round((w * h) / DENSITY);
      dots = [];
      for (let i = 0; i < n; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * MAX_SPEED,
          vy: (Math.random() - 0.5) * MAX_SPEED,
          r: Math.random() * 1.6 + 0.6,
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const frame = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const o of dots) {
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        if (o.x < 0) o.x += w; else if (o.x > w) o.x -= w;
        if (o.y < 0) o.y += h; else if (o.y > h) o.y -= h;

        let a = BASE_ALPHA, r = o.r;
        if (mouse.active) {
          const dx = o.x - mouse.x, dy = o.y - mouse.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < INFLUENCE) {
            const e = 1 - d / INFLUENCE;
            o.x += (dx / d) * e * REPEL * dt;
            o.y += (dy / d) * e * REPEL * dt;
            a = BASE_ALPHA + e * 0.5;
            r = o.r + e * 1.6;
          }
        }
        ctx.beginPath();
        ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${a})`;
        ctx.fill();
      }
    };

    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frame(dt);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; };
    const obs = new MutationObserver(() => {
      rgb = toRgb(getComputedStyle(document.documentElement).getPropertyValue("--fg"));
    });

    resize();
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    if (reduced) {
      frame(0); // one static frame, no animation
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
    />
  );
}
