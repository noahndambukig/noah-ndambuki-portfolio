import type { Command } from "@/lib/terminal/types";
import { banner } from "./banner";
import { boot } from "./boot";
import { clear } from "./clear";
import { customize } from "./customize";
import { echo } from "./echo";
import { help } from "./help";
import { mufc } from "./mufc";
import { theme } from "./theme";

// The canonical command list. Add a command by importing it and appending here;
// it will automatically appear in `help` and (later) tab-completion.
export const commands: Command[] = [
  help,
  clear,
  theme,
  customize,
  banner,
  mufc,
  boot,
  echo,
];
