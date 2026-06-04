import { USER } from "@/lib/terminal/constants";
import type { Command } from "@/lib/terminal/types";

export const whoami: Command = {
  name: "whoami",
  summary: "print the current user",
  usage: "whoami",
  run: () => ({
    type: "group",
    items: [
      { type: "text", text: USER },
      { type: "text", tone: "muted", text: "— run 'about' to see whoiam" },
    ],
  }),
};
