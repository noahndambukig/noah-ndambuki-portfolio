import { asset } from "@/lib/asset";
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
      items.push({ type: "text", text: `${e.start} – ${e.end}`, tone: "muted", animate: true });
      for (const b of e.bullets) items.push({ type: "text", text: `  • ${b}`, animate: true });
      if (i < history.length - 1) items.push({ type: "spacer" });
    });
    items.push({ type: "spacer" });
    items.push({ type: "text", text: "Learn More —", tone: "muted", animate: true });
    items.push({
      type: "link",
      href: asset("/resume.pdf"),
      label: "Resume ↗",
      external: true,
      reveal: "slide",
    });
    return { type: "group", items };
  },
};
