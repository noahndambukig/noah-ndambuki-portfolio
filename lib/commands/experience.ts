import { experience as history } from "@/lib/content/experience";
import type { Command, OutputContent } from "@/lib/terminal/types";

export const experience: Command = {
  name: "experience",
  aliases: ["work"],
  summary: "where I've worked",
  usage: "experience",
  run: () => {
    const items: OutputContent[] = [];
    history.forEach((e, i) => {
      items.push({ type: "text", text: `${e.role} · ${e.company}`, tone: "accent" });
      items.push({ type: "text", text: `${e.start} – ${e.end}`, tone: "muted" });
      for (const b of e.bullets) items.push({ type: "text", text: `  • ${b}` });
      if (i < history.length - 1) items.push({ type: "spacer" });
    });
    return { type: "group", items };
  },
};
