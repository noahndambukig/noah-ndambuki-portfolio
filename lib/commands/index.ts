import type { Command } from "@/lib/terminal/types";
import { about } from "./about";
import { boot } from "./boot";
import { cat } from "./cat";
import { clear } from "./clear";
import { contact } from "./contact";
import { echo } from "./echo";
import { experience } from "./experience";
import { help } from "./help";
import { history } from "./history";
import { home } from "./home";
import { email, github, linkedin } from "./links";
import { ls } from "./ls";
import { man } from "./man";
import { open } from "./open";
import { projects } from "./projects";
import { resume } from "./resume";
import { snake } from "./snake";
import { theme } from "./theme";
import { whoami } from "./whoami";

// The canonical command list. Add a command by importing it and appending here;
// it auto-appears in help, tab-completion, and ghost suggestions.
export const commands: Command[] = [
  help,
  man,
  home,
  about,
  whoami,
  projects,
  open,
  experience,
  contact,
  resume,
  github,
  linkedin,
  email,
  theme,
  ls,
  cat,
  history,
  snake,
  boot,
  clear,
  echo,
];
