import { asset } from "@/lib/asset";
import type { Command } from "@/lib/terminal/types";

export const resume: Command = {
  name: "resume",
  aliases: ["cv"],
  summary: "view my résumé",
  usage: "resume",
  run: () => {
    if (typeof window !== "undefined") {
      window.open(asset("/resume.pdf"), "_blank", "noopener");
    }
    return { type: "text", tone: "muted", text: "opening résumé (resume.pdf)…" };
  },
};
