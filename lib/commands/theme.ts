import type { Command } from "@/lib/terminal/types";
import { THEME_NAMES, THEMES } from "@/lib/themes/themes";

const SELECTABLE = [...THEME_NAMES, "reset"];

export const theme: Command = {
  name: "theme",
  summary: "view or switch the color theme",
  usage: "theme [name | custom | reset]",
  complete: (args) =>
    SELECTABLE.filter((n) => n.startsWith((args[0] ?? "").toLowerCase())),
  run: (ctx) => {
    const requested = ctx.args[0]?.toLowerCase();

    if (!requested) {
      return {
        type: "group",
        items: [
          { type: "text", text: "Available themes", tone: "muted", reveal: "slide" },
          {
            type: "table",
            animate: true,
            rows: THEME_NAMES.map((n): [string, string] => [
              n === ctx.theme ? `▸ ${n}` : `  ${n}`,
              THEMES[n].label,
            ]),
          },
          { type: "spacer" },
          {
            type: "text",
            text: "theme <name> · 'theme custom' to design your own · 'theme reset' to restore",
            tone: "muted",
          },
        ],
      };
    }

    if (requested === "custom") {
      ctx.openCustomizer();
      return {
        type: "text",
        tone: "muted",
        text: "opening color picker — adjust any color to build your theme",
        reveal: "dispatch",
      };
    }

    if (requested === "reset") {
      ctx.resetCustom();
      return {
        type: "text",
        tone: "success",
        text: "custom theme reset to defaults",
        reveal: "flash",
      };
    }

    if (!ctx.setTheme(requested)) {
      return {
        type: "text",
        tone: "error",
        text: `unknown theme: ${requested} — try: ${THEME_NAMES.join(", ")}`,
        animate: true,
      };
    }

    return { type: "text", tone: "success", text: `theme set to ${requested}`, reveal: "flash" };
  },
};
