import { pathCandidates, resolve } from "@/lib/content/filesystem";
import type { Command, OutputContent } from "@/lib/terminal/types";

export const cat: Command = {
  name: "cat",
  summary: "print a file's contents",
  usage: "cat <file>",
  complete: (args) => pathCandidates(args[args.length - 1] ?? ""),
  run: (ctx) => {
    const path = ctx.args[0];
    if (!path) {
      return { type: "text", tone: "error", text: "cat: missing file operand — try 'ls'", animate: true };
    }
    const node = resolve(path);
    if (!node) {
      return { type: "text", tone: "error", text: `cat: ${path}: no such file or directory`, animate: true };
    }
    if (node.kind === "dir") {
      return { type: "text", tone: "error", text: `cat: ${path}: is a directory`, animate: true };
    }

    // Blank body lines become spacers so the file keeps its paragraph breaks.
    const items: OutputContent[] = (node.entry.body ?? []).map((line) =>
      line ? { type: "text", text: line } : { type: "spacer" },
    );
    if (node.entry.hint) {
      items.push({ type: "text", tone: "muted", text: `— run '${node.entry.hint}' for the live version` });
    }
    return { type: "group", items };
  },
};
