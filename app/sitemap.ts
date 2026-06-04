import type { MetadataRoute } from "next";

// Emitted as a static /sitemap.xml during `next build` (output: "export").
export const dynamic = "force-static";

const SITE_URL = "https://ndambuki.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 }];
}
