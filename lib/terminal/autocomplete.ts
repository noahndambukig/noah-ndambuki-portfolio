import type { Registry } from "./types";

export interface CompleteResult {
  /** Full replacement for the input line. */
  completion?: string;
  /** Ambiguous candidates to display when completion can't progress. */
  listing?: string[];
}

function longestCommonPrefix(items: string[]): string {
  if (items.length === 0) return "";
  let prefix = items[0];
  for (const s of items) {
    let i = 0;
    while (i < prefix.length && i < s.length && prefix[i] === s[i]) i++;
    prefix = prefix.slice(0, i);
    if (!prefix) break;
  }
  return prefix;
}

/**
 * Bash-style completion. Completes the command name (first token) or, once past
 * the command, delegates to that command's `complete(args)` for argument
 * candidates. A single match fills + trails a space; multiple matches extend to
 * the common prefix, and if that adds nothing, return the candidates as a listing.
 */
export function autocomplete(input: string, registry: Registry): CompleteResult {
  const hasTrailingSpace = /\s$/.test(input);
  const leading = input.match(/^\s*/)?.[0] ?? "";
  const trimmed = input.trim();
  const tokens = trimmed.length ? trimmed.split(/\s+/) : [];

  // --- command name ---
  if (tokens.length <= 1 && !hasTrailingSpace) {
    const prefix = (tokens[0] ?? "").toLowerCase();
    const matches = registry.names().filter((n) => n.startsWith(prefix));
    if (matches.length === 0) return {};
    if (matches.length === 1) return { completion: `${leading}${matches[0]} ` };
    const lcp = longestCommonPrefix(matches);
    if (lcp.length > prefix.length) return { completion: leading + lcp };
    return { listing: matches };
  }

  // --- argument of a known command ---
  const cmd = registry.lookup(tokens[0].toLowerCase());
  if (!cmd?.complete) return {};
  const argsBefore = hasTrailingSpace ? tokens.slice(1) : tokens.slice(1, -1);
  const partial = hasTrailingSpace ? "" : tokens[tokens.length - 1];
  const candidates = cmd.complete([...argsBefore, partial]);
  if (candidates.length === 0) return {};

  const head = (hasTrailingSpace ? tokens : tokens.slice(0, -1)).join(" ");
  const rebuild = (val: string, trail: boolean) =>
    `${leading}${head} ${val}${trail ? " " : ""}`;

  if (candidates.length === 1) return { completion: rebuild(candidates[0], true) };
  const lcp = longestCommonPrefix(candidates);
  if (lcp.length > partial.length) return { completion: rebuild(lcp, false) };
  return { listing: candidates };
}

/**
 * The "ghost" suffix to show inline after the input — ONLY when exactly one
 * candidate remains and it strictly extends what's typed. Empty string otherwise
 * (ambiguous, no match, or already complete). This is what Tab would fill in.
 */
export function suggest(input: string, registry: Registry): string {
  const hasTrailingSpace = /\s$/.test(input);
  const trimmed = input.trim();
  const tokens = trimmed.length ? trimmed.split(/\s+/) : [];

  // command name
  if (tokens.length <= 1 && !hasTrailingSpace) {
    const prefix = (tokens[0] ?? "").toLowerCase();
    if (!prefix) return "";
    const matches = registry.names().filter((n) => n.startsWith(prefix));
    return matches.length === 1 && matches[0].length > prefix.length
      ? matches[0].slice(prefix.length)
      : "";
  }

  // argument of a known command
  const cmd = registry.lookup(tokens[0].toLowerCase());
  if (!cmd?.complete) return "";
  const partial = hasTrailingSpace ? "" : tokens[tokens.length - 1];
  if (!partial) return "";
  const argsBefore = hasTrailingSpace ? tokens.slice(1) : tokens.slice(1, -1);
  const candidates = cmd.complete([...argsBefore, partial]);
  return candidates.length === 1 &&
    candidates[0].length > partial.length &&
    candidates[0].toLowerCase().startsWith(partial.toLowerCase())
    ? candidates[0].slice(partial.length)
    : "";
}
