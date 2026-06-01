// Shell identity used in the prompt and status bar. Central so a single edit
// re-skins every prompt across the app.
export const USER = "visitor";
export const HOST = "ndambuki";
export const USER_HOST = `${USER}@${HOST}`;
export const PROMPT = `${USER_HOST}:~$`;

// Stable id for the resting name-banner line, so the boot can re-trigger its
// glitch-reveal animation by keying on it.
export const BANNER_LINE_ID = "banner";

// One-line tagline under the banner (resting state). Edit freely.
export const TAGLINE = "developer · lifelong manchester united fan";
