// Pass-through for now: renders the full text instantly. Step 5 replaces the
// body with a progressive char reveal (and a skip-on-keypress). Isolating it
// here means the typewriter upgrade touches exactly one file.
export function Typewriter({ text }: { text: string }) {
  return <>{text}</>;
}
