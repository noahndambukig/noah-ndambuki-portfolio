import { projects as projectList } from "@/lib/content/projects";
import type { Command } from "@/lib/terminal/types";

export const projects: Command = {
  name: "projects",
  aliases: ["repos"],
  summary: "my work",
  usage: "projects",
  run: () => ({
    type: "group",
    items: [
      {
        type: "text",
        text: "select a project — click a card or run 'open <name>':",
        tone: "muted",
      },
      {
        type: "cards",
        animate: true,
        items: projectList.map((p) => ({
          icon: p.icon ?? "folder",
          name: p.name,
          desc: p.blurb,
          run: `open ${p.slug}`,
        })),
      },
    ],
  }),
};
