import { launcherCards } from "@/lib/content/launcher";
import type { Command } from "@/lib/terminal/types";

export const home: Command = {
  name: "home",
  aliases: ["menu", "welcome"],
  summary: "show the launcher",
  usage: "home",
  run: () => ({
    type: "group",
    items: [
      { type: "text", text: "jump to a section:", tone: "muted" },
      launcherCards,
    ],
  }),
};
