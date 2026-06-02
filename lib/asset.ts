// Prefix a root-relative public asset with the deploy base path so URLs stay
// correct if the site ever moves off the custom domain to /<repo> on GitHub Pages.
// next.config.mjs exposes NEXT_PUBLIC_BASE_PATH (empty on the custom domain).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
