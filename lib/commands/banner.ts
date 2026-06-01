import { NAME_BANNER } from "@/lib/content/ascii";
import type { Command } from "@/lib/terminal/types";

export const banner: Command = {
  name: "banner",
  aliases: ["logo"],
  summary: "print the name banner",
  usage: "banner",
  run: () => ({ type: "ascii", text: NAME_BANNER, tone: "accent" }),
};
