// Visitor preference for the cursor-reactive ASCII background.
//
// Lives on the <html> element as an attribute rather than in React state: the
// background canvas is mounted from the server-rendered layout while the switch
// sits in the terminal's status bar, so the two share no React tree. A root
// attribute is the one channel both already reach — AsciiBackground's existing
// MutationObserver (which watches for theme changes) picks the toggle up for free.
//
// "On" is the ABSENCE of the attribute, so default HTML carries no marker and
// only visitors who opted out pay for one.
//
// Constants only, no React: the server-rendered layout imports these to build its
// pre-paint inline script, and a hook here would drag a client module into it.

export const CURSOR_FX_STORAGE_KEY = "terminal:cursor-fx";
export const CURSOR_FX_ATTR = "data-cursor-fx";
export const CURSOR_FX_OFF = "off";
