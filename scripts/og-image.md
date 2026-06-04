# Regenerating the social card (`public/og.png`)

The Open Graph / Twitter card ships as a **static file** at `public/og.png`.

Why static and not a dynamic `app/opengraph-image.tsx` route: GitHub Pages serves
files by extension, so a real `.png` gets the correct `image/png` content-type. A
dynamic route exports an **extensionless** file (`out/opengraph-image`) that Pages
serves as `application/octet-stream`, which Facebook / LinkedIn / X crawlers reject.

> Note: this generator is kept as Markdown, not a live `.tsx`, on purpose — a
> compiled file that imports `next/og` outside a real metadata route breaks
> `next build` (the page-data phase fails with a missing webpack chunk).

## Steps

1. Create `app/opengraph-image.tsx` with the code below.
2. `npm run build` (clear `.next` first if you hit a stale-chunk error: `Remove-Item -Recurse -Force .next`).
3. `Copy-Item out/opengraph-image public/og.png -Force`
4. Delete `app/opengraph-image.tsx` again, then rebuild so the static export is clean.

## Generator

```tsx
import { ImageResponse } from "next/og";
import { profile } from "@/lib/content/profile";
import { PROMPT } from "@/lib/terminal/constants";
import { DEFAULT_THEME, THEMES } from "@/lib/themes/themes";

// Required under output: "export" — otherwise the build treats the image route as
// dynamic and aborts.
export const dynamic = "force-static";

export const alt = `${profile.name} — ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const t = THEMES[DEFAULT_THEME].vars;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: `radial-gradient(120% 120% at 50% 0%, ${t["--bg-lift"]}, ${t["--bg"]} 70%)`,
          color: t["--accent"],
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: t["--fg-dim"], letterSpacing: 2 }}>
          {`${PROMPT} whoami`}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 28,
            fontSize: 104,
            fontWeight: 700,
            color: t["--accent"],
          }}
        >
          {profile.name}
          {/* Solid block caret — the terminal's blinking cursor, frozen. */}
          <span
            style={{
              display: "flex",
              width: 38,
              height: 92,
              marginLeft: 18,
              background: t["--accent"],
              opacity: 0.9,
            }}
          />
        </div>

        <div style={{ display: "flex", marginTop: 14, fontSize: 46, color: "#f3d9cf" }}>
          {profile.role}
        </div>

        <div style={{ display: "flex", marginTop: 56, fontSize: 28, color: t["--fg-dim"] }}>
          ndambuki.ca · terminal-style portfolio
        </div>
      </div>
    ),
    { ...size },
  );
}
```
