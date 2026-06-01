import type { Command, Registry } from "./types";

/**
 * Build a command registry from a flat list. Names and aliases both resolve via
 * `lookup`, but `list`/`names` iterate the canonical array so aliases never
 * produce duplicates. Adding a command is a one-line change to the source list.
 */
export function createRegistry(commands: Command[]): Registry {
  const byName = new Map<string, Command>();
  for (const cmd of commands) {
    byName.set(cmd.name, cmd);
    for (const alias of cmd.aliases ?? []) byName.set(alias, cmd);
  }

  return {
    lookup: (name) => byName.get(name),
    list: (opts) =>
      commands.filter((c) => opts?.includeHidden || !c.hidden),
    names: (includeHidden) =>
      commands.filter((c) => includeHidden || !c.hidden).map((c) => c.name),
  };
}
