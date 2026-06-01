import type { Command } from "@/lib/terminal/types";

export const echo: Command = {
  name: "echo",
  summary: "print text back to the screen",
  usage: "echo <text>",
  run: (ctx) => ({ type: "text", text: ctx.args.join(" "), animate: true }),
};
