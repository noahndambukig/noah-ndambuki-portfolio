import { NAME_BANNER } from "@/lib/content/ascii";
import { launcherCards } from "@/lib/content/launcher";
import type { Command } from "@/lib/terminal/types";

export const home: Command = {
  name: "home",
  aliases: ["menu", "welcome"],
  summary: "show the welcome screen",
  usage: "home",
  // Mirrors the freshly-booted resting state (banner + tagline + launcher) so
  // `home` brings the visitor back to exactly what a reload would show.
  run: () => ({
    type: "group",
    items: [
      { type: "ascii", text: NAME_BANNER, tone: "accent" },
      {
        type: "text",
        text: "type 'help' for commands, or click a card below",
        tone: "muted",
      },
      launcherCards,
    ],
  }),
};
