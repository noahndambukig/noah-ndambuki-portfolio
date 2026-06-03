import { profile } from "@/lib/content/profile";
import type { Command, OutputContent } from "@/lib/terminal/types";

export const contact: Command = {
  name: "contact",
  summary: "get in touch",
  usage: "contact",
  run: () => {
    const { email, github, linkedin } = profile.links;
    const items: OutputContent[] = [
      { type: "text", text: "reach me:", tone: "muted" },
      { type: "link", href: `mailto:${email}`, label: `✉  ${email}` },
      { type: "link", href: github, label: "GitHub ↗", external: true },
      { type: "link", href: linkedin, label: "LinkedIn ↗", external: true },
    ];
    return { type: "group", items };
  },
};
