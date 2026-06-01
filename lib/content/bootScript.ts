// The system boot-log lines (Manchester United facts are interleaved at runtime
// by BootSequence). `tag` drives the colored status label. Edit freely.
export type BootTag = "ok" | "warn" | "info" | "mufc";

export interface BootStep {
  text: string;
  tag?: BootTag; // defaults to "ok"
}

export const BOOT_STEPS: BootStep[] = [
  { text: "ndambuki-os 0.1.0 (tty1)", tag: "info" },
  { text: "POST … memory check 64K OK", tag: "ok" },
  { text: "mounting /home/visitor", tag: "ok" },
  { text: "mounting /projects", tag: "ok" },
  { text: "starting skills.service", tag: "ok" },
  { text: "starting experience.daemon", tag: "ok" },
  { text: "loading fan_profile → manchester_united", tag: "ok" },
  { text: "coffee.service degraded — refill required", tag: "warn" },
  { text: "establishing uplink → ndambuki.ca", tag: "ok" },
  { text: "rendering identity", tag: "ok" },
];

// Indices in BOOT_STEPS after which a random [MUFC] fact is spliced in.
export const FACT_SLOTS = [3, 6, 9];
