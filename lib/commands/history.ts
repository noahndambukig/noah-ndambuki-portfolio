import type { Command } from "@/lib/terminal/types";

export const history: Command = {
  name: "history",
  summary: "show previously run commands",
  usage: "history",
  run: (ctx) => {
    // ctx.history includes this `history` invocation (like a real shell); drop it.
    const past = ctx.history.slice(0, -1);
    if (past.length === 0) {
      return { type: "text", tone: "muted", text: "no history yet", animate: true };
    }
    const rows = past.map((cmd, i): [string, string] => [String(i + 1), cmd]);
    return { type: "table", rows, animate: true };
  },
};
