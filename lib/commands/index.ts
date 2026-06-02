import type { Command } from "@/lib/terminal/types";
import { about } from "./about";
import { banner } from "./banner";
import { boot } from "./boot";
import { clear } from "./clear";
import { contact } from "./contact";
import { customize } from "./customize";
import { echo } from "./echo";
import { experience } from "./experience";
import { help } from "./help";
import { home } from "./home";
import { email, github, linkedin } from "./links";
import { open } from "./open";
import { projects } from "./projects";
import { resume } from "./resume";
import { snake } from "./snake";
import { theme } from "./theme";

// The canonical command list. Add a command by importing it and appending here;
// it auto-appears in help, tab-completion, and ghost suggestions.
export const commands: Command[] = [
  help,
  home,
  about,
  projects,
  open,
  experience,
  contact,
  resume,
  github,
  linkedin,
  email,
  theme,
  customize,
  banner,
  snake,
  boot,
  clear,
  echo,
];
