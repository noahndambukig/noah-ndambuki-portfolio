import { projects } from "@/lib/content/projects";
import type { Command } from "@/lib/terminal/types";

export const open: Command = {
  name: "open",
  summary: "open a project",
  usage: "open <project>",
  complete: (args) =>
    projects
      .map((p) => p.slug)
      .filter((s) => s.startsWith((args[0] ?? "").toLowerCase())),
  run: (ctx) => {
    const slug = ctx.args[0]?.toLowerCase();
    const project = projects.find((p) => p.slug === slug);
    if (!project) {
      return {
        type: "text",
        tone: "error",
        text: `no such project: ${ctx.args[0] ?? "(none)"} — run 'projects' to list them`,
        animate: true,
      };
    }
    ctx.openProject(project.slug);
  },
};
