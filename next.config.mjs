/** @type {import('next').NextConfig} */

// This site is served from the root of a custom domain (ndambuki.ca) via
// GitHub Pages, so there is NO path prefix. If you ever drop the custom
// domain and serve from https://<user>.github.io/<repo>/, set basePath/
// assetPrefix to "/<repo>" instead.
const basePath = "";

const nextConfig = {
  // Emit a fully static site into ./out — required for GitHub Pages.
  output: "export",
  basePath,
  // Exposed to the client for building asset URLs (e.g. a résumé download)
  // from inside components. Empty while served at the domain root.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // GitHub Pages has no image optimization server.
  images: { unoptimized: true },
  // Emit /about/index.html style paths so deep links resolve on Pages.
  trailingSlash: true,
};

export default nextConfig;
