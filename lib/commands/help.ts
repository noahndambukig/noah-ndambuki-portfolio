import type { Command } from "@/lib/terminal/types";

export const help: Command = {
  name: "help",
  aliases: ["?", "h"],
  summary: "list available commands",
  usage: "help",
  run: (ctx) => {
    const rows = ctx.registry
      .list()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c): [string, string] => [c.name, c.summary]);

    return {
      type: "group",
      items: [
        { type: "text", text: "Available commands", tone: "muted" },
        { type: "table", rows },
        { type: "spacer" },
        {
          type: "text",
          text: "↑/↓ history · Ctrl+L clear · 'theme' to change colors",
          tone: "muted",
        },
      ],
    };
  },
};
