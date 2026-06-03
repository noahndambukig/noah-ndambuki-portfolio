"use client";

import type { CSSProperties } from "react";
import type { OutputContent, Reveal } from "@/lib/terminal/types";
import { Card } from "./Card";
import { Typewriter } from "./Typewriter";

// A reveal animation's class + its stagger index (as a CSS var). `index` is the
// line's position within its group, so group children cascade one after another;
// standalone lines (index undefined) start immediately.
function reveal(kind: Reveal | undefined, index: number | undefined) {
  if (!kind) return { className: "", style: undefined as CSSProperties | undefined };
  return {
    className: ` ob-reveal ob-reveal--${kind}`,
    style: index != null ? ({ "--ob-i": index } as CSSProperties) : undefined,
  };
}

// The single place structured OutputContent becomes JSX. Keeping all React here
// lets lib/terminal stay serializable and framework-free. `index` is the line's
// position within an enclosing group, used only to stagger reveal animations.
export function OutputBlock({
  content,
  index,
}: {
  content: OutputContent;
  index?: number;
}) {
  switch (content.type) {
    case "text": {
      const r = reveal(content.reveal, index);
      return (
        <div className={`ob-text tone-${content.tone ?? "default"}${r.className}`} style={r.style}>
          <Typewriter text={content.text} animate={content.animate} />
        </div>
      );
    }

    case "ascii": {
      const r = reveal(content.reveal, index);
      return (
        <pre className={`ob-ascii tone-${content.tone ?? "default"}${r.className}`} style={r.style}>
          {content.text}
        </pre>
      );
    }

    case "link": {
      const r = reveal(content.reveal, index);
      return (
        <a
          className={`ob-link tone-${content.tone ?? "accent"}${r.className}`}
          style={r.style}
          href={content.href}
          target={content.external ? "_blank" : undefined}
          rel={content.external ? "noopener noreferrer" : undefined}
        >
          {content.label}
        </a>
      );
    }

    case "keyval":
      return (
        <div className={`ob-keyval tone-${content.tone ?? "default"}`}>
          {content.pairs.map(([key, value], i) => (
            <div key={i} className="ob-keyval-row">
              <span className="ob-key tone-muted">{key}</span>
              <span className="ob-val">{value}</span>
            </div>
          ))}
        </div>
      );

    case "table":
      return (
        <div
          className={`ob-table tone-${content.tone ?? "default"}${content.animate ? " ob-table--reveal" : ""}`}
          style={{
            gridTemplateColumns: `repeat(${content.rows[0]?.length ?? 1}, max-content)`,
          }}
        >
          {content.rows.map((row, ri) =>
            row.map((cell, ci) => (
              <span
                key={`${ri}-${ci}`}
                className="ob-cell"
                // Per-row stagger with a slight per-column offset → a diagonal
                // left-to-right print. No-op unless .ob-table--reveal is set.
                style={
                  content.animate
                    ? { animationDelay: `${ri * 55 + ci * 35}ms` }
                    : undefined
                }
              >
                {cell}
              </span>
            )),
          )}
        </div>
      );

    case "cards":
      return (
        <div className={`card-grid${content.animate ? " card-grid--reveal" : ""}`}>
          {content.items.map((item, i) => (
            <Card
              key={i}
              icon={item.icon}
              name={item.name}
              desc={item.desc}
              run={item.run}
            />
          ))}
        </div>
      );

    case "group":
      return (
        <div className="ob-group">
          {content.items.map((item, i) => (
            <OutputBlock key={i} content={item} index={i} />
          ))}
        </div>
      );

    case "spacer":
      return (
        <div
          className="ob-spacer"
          style={{ height: `${content.lines ?? 1}em` }}
          aria-hidden="true"
        />
      );

    default:
      return null;
  }
}
