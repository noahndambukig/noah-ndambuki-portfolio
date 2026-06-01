import type { OutputContent } from "@/lib/terminal/types";
import { Typewriter } from "./Typewriter";

// The single place structured OutputContent becomes JSX. Keeping all React here
// lets lib/terminal stay serializable and framework-free.
export function OutputBlock({ content }: { content: OutputContent }) {
  switch (content.type) {
    case "text":
      return (
        <div className={`ob-text tone-${content.tone ?? "default"}`}>
          <Typewriter text={content.text} />
        </div>
      );

    case "ascii":
      return (
        <pre className={`ob-ascii tone-${content.tone ?? "default"}`}>
          {content.text}
        </pre>
      );

    case "link":
      return (
        <a
          className={`ob-link tone-${content.tone ?? "accent"}`}
          href={content.href}
          target={content.external ? "_blank" : undefined}
          rel={content.external ? "noopener noreferrer" : undefined}
        >
          {content.label}
        </a>
      );

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
          className={`ob-table tone-${content.tone ?? "default"}`}
          style={{
            gridTemplateColumns: `repeat(${content.rows[0]?.length ?? 1}, max-content)`,
          }}
        >
          {content.rows.map((row, ri) =>
            row.map((cell, ci) => (
              <span key={`${ri}-${ci}`} className="ob-cell">
                {cell}
              </span>
            )),
          )}
        </div>
      );

    case "group":
      return (
        <div className="ob-group">
          {content.items.map((item, i) => (
            <OutputBlock key={i} content={item} />
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
