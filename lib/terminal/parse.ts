export interface ParsedInput {
  name: string;
  args: string[];
  raw: string;
}

/**
 * Split a raw input line into a command name + args. The command name is
 * lowercased for case-insensitive lookup; args keep their original case.
 * Whitespace-only input yields an empty name. (Quote-aware parsing can come
 * later without changing this signature.)
 */
export function parse(input: string): ParsedInput {
  const raw = input.trim();
  const parts = raw.length ? raw.split(/\s+/) : [];
  const name = (parts[0] ?? "").toLowerCase();
  return { name, args: parts.slice(1), raw };
}
