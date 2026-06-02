"use client";

import { useEffect, useState } from "react";

// The status-bar clock. It owns its own per-second state so its ticks DON'T
// re-render the rest of the terminal — critically, the live custom-theme color
// picker, whose controlled <input type="color"> wells would otherwise be
// reconciled (resetting an in-progress OS picker selection) on every tick.
// Renders a stable placeholder on the server + first client paint, then ticks
// post-mount — no SSR timestamp, so no hydration mismatch.
export function Clock() {
  const [clock, setClock] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setClock(new Date().toTimeString().slice(0, 8));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="statusbar-clock" suppressHydrationWarning>
      {clock ?? "--:--:--"}
    </span>
  );
}
