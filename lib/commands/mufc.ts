import { UNITED_CREST } from "@/lib/content/ascii";
import { pickFacts } from "@/lib/content/mufc";
import type { Command } from "@/lib/terminal/types";

export const mufc: Command = {
  name: "mufc",
  aliases: ["united"],
  summary: "Manchester United — crest & a fact",
  usage: "mufc",
  run: () => ({
    type: "group",
    items: [
      { type: "ascii", text: UNITED_CREST, tone: "brand" },
      { type: "spacer" },
      { type: "text", text: `[ MUFC ] ${pickFacts(1)[0]}`, tone: "brand" },
      { type: "text", text: "glory glory man united", tone: "muted" },
    ],
  }),
};
