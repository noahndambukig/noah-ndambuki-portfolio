/** @type {import('next').NextConfig} */

// GitHub Pages serves project sites from /<repo>, so we need a basePath in
// production. Locally (next dev / next build served at root) we want no prefix.
const isProd = process.env.NODE_ENV === "production";
const repo = "noah-ndambuki-portfolio";
const basePath = isProd ? `/${repo}` : "";

const nextConfig = {
  // Emit a fully static site into ./out — required for GitHub Pages.
  output: "export",
  basePath,
  // Expose the basePath to the client so we can build correct asset URLs
  // (e.g. the generated résumé download) from inside components.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // GitHub Pages has no image optimization server.
  images: { unoptimized: true },
  // Emit /about/index.html style paths so deep links resolve on Pages.
  trailingSlash: true,
};

export default nextConfig;
