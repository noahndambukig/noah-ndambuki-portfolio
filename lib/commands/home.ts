import { NAME_BANNER } from "@/lib/content/ascii";
import { launcherCards } from "@/lib/content/launcher";
import type { Command, OutputContent } from "@/lib/terminal/types";

// `home` is an explicit re-entry, so unlike the static resting/boot launcher its
// cards scan in. A copy keeps the shared launcherCards (resting state) static.
const animatedLauncher: OutputContent =
  launcherCards.type === "cards"
    ? { ...launcherCards, animate: true }
    : launcherCards;

export const home: Command = {
  name: "home",
  aliases: ["menu", "welcome"],
  summary: "show the welcome screen",
  usage: "home",
  // Mirrors the freshly-booted resting state (banner + tagline + launcher) so
  // `home` brings the visitor back to exactly what a reload would show — with the
  // banner glitching in and the launcher scanning in for the re-entry.
  run: () => ({
    type: "group",
    items: [
      { type: "ascii", text: NAME_BANNER, tone: "accent", reveal: "glitch" },
      {
        type: "text",
        text: "type 'help' for commands, or click a card below",
        tone: "muted",
      },
      animatedLauncher,
    ],
  }),
};
