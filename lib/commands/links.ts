import { profile } from "@/lib/content/profile";
import type { Command, OutputContent } from "@/lib/terminal/types";

// Direct openers for the common links.
function opener(
  name: string,
  summary: string,
  href: () => string,
  note: string,
): Command {
  return {
    name,
    summary,
    usage: name,
    run: () => {
      if (typeof window !== "undefined") window.open(href(), "_blank", "noopener");
      return { type: "text", tone: "muted", text: note, reveal: "dispatch" } as OutputContent;
    },
  };
}

export const github = opener(
  "github",
  "open my GitHub",
  () => profile.links.github,
  "opening GitHub…",
);
export const linkedin = opener(
  "linkedin",
  "open my LinkedIn",
  () => profile.links.linkedin,
  "opening LinkedIn…",
);
export const email: Command = {
  name: "email",
  summary: "email me",
  usage: "email",
  run: () => {
    if (typeof window !== "undefined") {
      window.location.href = `mailto:${profile.links.email}`;
    }
    return {
      type: "text",
      tone: "muted",
      text: `opening mail to ${profile.links.email}…`,
      reveal: "dispatch",
    };
  },
};
