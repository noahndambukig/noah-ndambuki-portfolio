import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import {
  CUSTOM_STORAGE_KEY,
  CUSTOM_THEME,
  DEFAULT_THEME,
  EDITABLE_TOKENS,
  GLOW_ALPHA,
  SELECTION_ALPHA,
  STORAGE_KEY,
  THEMES,
  varsToCss,
} from "@/lib/themes/themes";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Noah Ndambuki",
  description: "Terminal-style personal portfolio.",
};

// Everything below derives from THEMES (single source): the <style> seeds :root
// for the SSR default paint; the script overrides with the user's stored theme
// before the page renders — no color flash, no duplicated token table. For the
// custom theme it merges the stored editable overrides defensively (bad JSON or
// stale keys silently fall back to base) and re-derives glow/selection from --fg.
const defaultVars = varsToCss(THEMES[DEFAULT_THEME].vars);
const editableKeys = JSON.stringify(EDITABLE_TOKENS.map((t) => t.key));
const noFlashScript = `(function(){try{var K=${JSON.stringify(
  STORAGE_KEY,
)},CK=${JSON.stringify(CUSTOM_STORAGE_KEY)},CUSTOM=${JSON.stringify(
  CUSTOM_THEME,
)},T=${JSON.stringify(THEMES)},E=${editableKeys},GA=${GLOW_ALPHA},SA=${SELECTION_ALPHA},hx=/^#[0-9a-fA-F]{6}$/,r=document.documentElement,n=localStorage.getItem(K);if(n&&T[n]){var v=Object.assign({},T[n].vars);if(n===CUSTOM){try{var s=JSON.parse(localStorage.getItem(CK)||"null");if(s&&typeof s==="object"){for(var i=0;i<E.length;i++){var ek=E[i],val=s[ek];if(typeof val==="string"&&hx.test(val)){v[ek]=val;}}}}catch(e2){}var m=/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(v["--fg"]);if(m){var R=parseInt(m[1],16),G=parseInt(m[2],16),B=parseInt(m[3],16);v["--glow"]="rgba("+R+", "+G+", "+B+", "+GA+")";v["--selection"]="rgba("+R+", "+G+", "+B+", "+SA+")";}}for(var k in v){r.style.setProperty(k,v[k]);}r.setAttribute("data-theme",n);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={plexMono.variable}
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root{${defaultVars}}` }} />
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
