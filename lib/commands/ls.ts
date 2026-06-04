import { pathCandidates, resolve } from "@/lib/content/filesystem";
import type { Command } from "@/lib/terminal/types";

export const ls: Command = {
  name: "ls",
  summary: "list files in the current directory",
  usage: "ls [path]",
  complete: (args) => pathCandidates(args[args.length - 1] ?? ""),
  run: (ctx) => {
    const path = ctx.args[0] ?? "";
    const node = resolve(path);
    if (!node) {
      return {
        type: "text",
        tone: "error",
        text: `ls: ${path || "."}: no such file or directory`,
        animate: true,
      };
    }
    const entries = node.kind === "dir" ? node.entries : [node.entry];
    // Trailing slash marks directories — the one cue `ls` gives without color.
    const names = entries.map((e) => (e.type === "dir" ? `${e.name}/` : e.name));
    return { type: "text", text: names.join("   "), animate: true };
  },
};
