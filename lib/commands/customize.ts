import type { Command } from "@/lib/terminal/types";

export const customize: Command = {
  name: "customize",
  aliases: ["colors"],
  summary: "open the custom theme color picker",
  usage: "customize",
  run: (ctx) => {
    ctx.openCustomizer();
    return {
      type: "text",
      tone: "muted",
      text: "color picker open — changes save automatically",
    };
  },
};
