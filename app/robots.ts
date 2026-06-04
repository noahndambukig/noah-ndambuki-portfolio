import type { MetadataRoute } from "next";

// Emitted as a static /robots.txt during `next build` (output: "export").
export const dynamic = "force-static";

const SITE_URL = "https://ndambuki.ca";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
