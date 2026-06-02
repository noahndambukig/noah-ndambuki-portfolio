"use client";

import { createContext, useContext } from "react";

// Lets deep/recursive output (cards inside groups) act on a click without
// prop-drilling. Terminal provides the real implementation. `fillCommand` pastes
// a command into the prompt (it does NOT run it — the visitor presses Enter).
export interface TerminalActions {
  fillCommand: (command: string) => void;
}

export const TerminalActionsContext = createContext<TerminalActions>({
  fillCommand: () => {},
});

export const useTerminalActions = () => useContext(TerminalActionsContext);
