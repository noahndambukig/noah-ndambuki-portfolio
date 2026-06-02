"use client";

import { createContext, useContext } from "react";

// Lets deep/recursive output (cards inside groups) dispatch a command on click
// without prop-drilling. Terminal provides the real implementation.
export interface TerminalActions {
  runCommand: (command: string) => void;
}

export const TerminalActionsContext = createContext<TerminalActions>({
  runCommand: () => {},
});

export const useTerminalActions = () => useContext(TerminalActionsContext);
