import type { Command } from "@/lib/terminal/types";

export const snake: Command = {
  name: "snake",
  summary: "play snake",
  usage: "snake",
  // The overlay is the output, so run() returns nothing — it just swaps the view.
  run: (ctx) => {
    ctx.openSnake();
  },
};
