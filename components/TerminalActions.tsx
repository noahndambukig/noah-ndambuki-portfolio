"use client";

import { createContext, useContext } from "react";

// Lets deep/recursive output (cards inside groups) act on a click without
// prop-drilling. Terminal provides the real implementation. `runCommand` echoes
// the command into the scrollback and executes it immediately.
export interface TerminalActions {
  runCommand: (command: string) => void;
}

export const TerminalActionsContext = createContext<TerminalActions>({
  runCommand: () => {},
});

export const useTerminalActions = () => useContext(TerminalActionsContext);
