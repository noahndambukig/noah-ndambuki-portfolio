// Deep-link contract for the terminal. A sharable URL can either open a project
// overlay (?p=<slug>) or run a command on load (?cmd=<line>). These are pure
// string helpers (no window access) so the contract stays testable; the
// imperative history.pushState / popstate wiring lives in useTerminal.

export const PROJECT_PARAM = "p";
export const CMD_PARAM = "cmd";

export interface DeepLink {
  /** Project slug from ?p= — an overlay to open directly, bypassing the boot. */
  project?: string;
  /** A command line from ?cmd= to run once on load (e.g. "about" or "open foo"). */
  cmd?: string;
}

/**
 * Parse the deep-link intent out of a `location.search` string. `URLSearchParams`
 * decodes percent-escapes and treats "+" as a space, so `?cmd=open+foo` yields
 * the command line "open foo". The slug is lowercased to match command lookup;
 * the command line keeps its case (args may be case-sensitive).
 */
export function parseDeepLink(search: string): DeepLink {
  const params = new URLSearchParams(search);
  const project = params.get(PROJECT_PARAM)?.trim().toLowerCase();
  const cmd = params.get(CMD_PARAM)?.trim();
  return { project: project || undefined, cmd: cmd || undefined };
}

/**
 * Build the path + query for viewing a project, preserving `pathname` so any
 * deploy base path (e.g. /<repo> on GitHub Pages) survives the rewrite.
 */
export function projectUrl(pathname: string, slug: string): string {
  return `${pathname}?${PROJECT_PARAM}=${encodeURIComponent(slug)}`;
}
