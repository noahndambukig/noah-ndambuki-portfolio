// Manchester United facts shown during the boot sequence (tagged [MUFC]) and by
// the `mufc` command. All claims web-verified; edit freely. Keep them concise so
// they read well as a single boot-log line.
export const MUFC_FACTS: string[] = [
  "1999 — first English club to win the Treble",
  "1968 — first English side to lift the European Cup (4–1 v Benfica)",
  "3× champions of Europe: 1968, 1999, 2008",
  "2008 — beat Chelsea on penalties in Moscow",
  "joint-record 20 English league titles",
  "a record 13 Premier League titles",
  "Old Trafford — the Theatre of Dreams, capacity 74,244",
  "largest club stadium in the United Kingdom",
  "Ryan Giggs — 963 apps; scored in a record 21 straight PL seasons",
  "Sir Alex Ferguson — 26 years, English football's most successful manager",
  "founded 1878 as Newton Heath; renamed Manchester United in 1902",
  "1999 final — Sheringham & Solskjær struck in stoppage time",
];

/**
 * Return `n` distinct random facts. MUST be called client-side (e.g. in an
 * effect or a command handler), never during render — it uses Math.random.
 */
export function pickFacts(n: number): string[] {
  const pool = [...MUFC_FACTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}
