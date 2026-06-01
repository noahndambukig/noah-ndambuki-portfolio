import type { Command } from "@/lib/terminal/types";

export const boot: Command = {
  name: "boot",
  aliases: ["reboot"],
  summary: "replay the boot sequence",
  usage: "boot",
  run: (ctx) => {
    ctx.startBoot();
  },
};
