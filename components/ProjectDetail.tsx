"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";
import type { DetailBlock, Project } from "@/lib/content/projects";
import { USER_HOST } from "@/lib/terminal/constants";

function Block({ block }: { block: DetailBlock }) {
  switch (block.kind) {
    case "heading":
      return <h2 className="detail-h">{block.text}</h2>;
    case "paragraph":
      return <p className="detail-p">{block.text}</p>;
    case "bullets":
      return (
        <ul className="detail-ul">
          {block.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    case "image":
      return (
        <figure className="detail-fig">
          {/* Static asset; no Next/Image (unoptimized export). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="detail-img" src={asset(block.src)} alt={block.alt ?? ""} />
          {block.caption && <figcaption className="detail-cap">{block.caption}</figcaption>}
        </figure>
      );
    default:
      return null;
  }
}

export function ProjectDetail({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    backRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      // Focus trap within the dialog.
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
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="detail"
      role="dialog"
      aria-modal="true"
      aria-label={`Project: ${project.name}`}
    >
      <header className="detail-bar">
        <span className="detail-crumb">
          {USER_HOST}/projects/<span className="detail-crumb-leaf">{project.slug}</span>
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

      <div className="detail-scroll-clip">
        <div
          className="detail-body"
          tabIndex={0}
          role="region"
          aria-label={`${project.name} details`}
        >
          <h1 className="detail-title">{project.name}</h1>
          <p className="detail-blurb">{project.blurb}</p>
          <div className="detail-meta">
            {project.tech.join(" · ")}
            {project.year ? ` · ${project.year}` : ""}
          </div>
          {(project.url || project.repo) && (
            <div className="detail-links">
              {project.url && (
                <a className="ob-link" href={project.url} target="_blank" rel="noopener noreferrer">
                  live ↗
                </a>
              )}
              {project.repo && (
                <a className="ob-link" href={project.repo} target="_blank" rel="noopener noreferrer">
                  source ↗
                </a>
              )}
            </div>
          )}
          {project.detail?.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </div>
      </div>
    </div>
  );
}
