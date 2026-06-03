import type { OutputContent } from "@/lib/terminal/types";

/** Output shown when an unknown command name is entered. */
export function notFound(name: string): OutputContent {
  return {
    type: "text",
    tone: "error",
    text: `command not found: ${name} — type 'help' for a list`,
    animate: true,
  };
}
