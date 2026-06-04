import type { Command, OutputContent } from "@/lib/terminal/types";
import { commands } from "./index";

export const man: Command = {
  name: "man",
  summary: "show a command's manual",
  usage: "man <command>",
  // Completion runs without ctx, so enumerate names from the canonical list.
  complete: (args) => {
    const partial = (args[args.length - 1] ?? "").toLowerCase();
    return commands.map((c) => c.name).filter((n) => n.startsWith(partial));
  },
  run: (ctx) => {
    const name = ctx.args[0]?.toLowerCase();
    if (!name) {
      return { type: "text", tone: "error", text: "what manual page do you want? try 'man man'", animate: true };
    }
    const cmd = ctx.registry.lookup(name);
    if (!cmd) {
      return { type: "text", tone: "error", text: `no manual entry for ${name}`, animate: true };
    }

    const pairs: Array<[string, string]> = [
      ["NAME", `${cmd.name} — ${cmd.summary}`],
      ["USAGE", cmd.usage ?? cmd.name],
    ];
    if (cmd.aliases?.length) pairs.push(["ALIASES", cmd.aliases.join(", ")]);
    const items: OutputContent[] = [{ type: "keyval", pairs }];
    if (cmd.hidden) {
      items.push({ type: "text", tone: "muted", text: "(hidden — not listed by help)" });
    }
    return { type: "group", items };
  },
};
