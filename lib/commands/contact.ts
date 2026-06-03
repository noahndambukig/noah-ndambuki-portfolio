import { profile } from "@/lib/content/profile";
import type { Command, OutputContent } from "@/lib/terminal/types";

export const contact: Command = {
  name: "contact",
  summary: "get in touch",
  usage: "contact",
  run: () => {
    const { email, github, linkedin } = profile.links;
    const items: OutputContent[] = [
      { type: "text", text: "reach me:", tone: "muted", reveal: "slide" },
      { type: "link", href: `mailto:${email}`, label: "Email ↗", reveal: "slide" },
      { type: "link", href: github, label: "GitHub ↗", external: true, reveal: "slide" },
      { type: "link", href: linkedin, label: "LinkedIn ↗", external: true, reveal: "slide" },
    ];
    return { type: "group", items };
  },
};
