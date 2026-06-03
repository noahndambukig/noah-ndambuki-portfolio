import { profile } from "@/lib/content/profile";
import type { Command } from "@/lib/terminal/types";

export const about: Command = {
  name: "about",
  aliases: ["whoami"],
  summary: "who I am",
  usage: "about",
  run: () => ({
    type: "group",
    items: [
      { type: "text", text: `${profile.name} — ${profile.role}`, tone: "accent", reveal: "slide" },
      { type: "text", text: profile.bio, animate: true },
    ],
  }),
};
