import type { Command } from "@/lib/terminal/types";

export const clear: Command = {
  name: "clear",
  aliases: ["cls"],
  summary: "clear the screen",
  usage: "clear",
  run: (ctx) => {
    ctx.clear();
  },
};
