import type { OutputContent } from "@/lib/terminal/types";

// The home launcher bubbles — reused in the welcome block (useTerminal.restingLines)
// and by the `home` command so they're reachable again after `clear`.
export const launcherCards: OutputContent = {
  type: "cards",
  items: [
    { icon: "user", name: "about", desc: "learn about me", run: "about" },
    { icon: "folder", name: "projects", desc: "view my work", run: "projects" },
    { icon: "clock", name: "experience", desc: "where I've worked", run: "experience" },
    { icon: "mail", name: "contact", desc: "get in touch", run: "contact" },
  ],
};
