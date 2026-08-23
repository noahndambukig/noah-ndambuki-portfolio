// Projects shown as bubbles by `projects`; clicking one opens its detail view.
// Placeholder content — edit freely. Add an `image` block only once the image
// exists in public/projects/ (the renderer never probes the filesystem).

// Media blocks default to the full body width; "medium" and "small" cap them
// so a tall screenshot doesn't dominate the page.
export type MediaSize = "medium" | "small";

export type DetailBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "image"; src: string; alt?: string; caption?: string; size?: MediaSize }
  | { kind: "video"; src: string; poster?: string; caption?: string; size?: MediaSize };

export interface Project {
  slug: string;
  name: string;
  blurb: string;
  tech: string[];
  year?: string;
  url?: string; // live demo
  repo?: string; // source
  icon?: string; // Card icon key
  detail?: { blocks: DetailBlock[] };
}

export const projects: Project[] = [
  {
    slug: "canyoubeatchess",
    name: "canyoubeatchess",
    blurb: "Play one chess model at five points in its training and feel it get stronger.",
    tech: ["Python", "PyTorch", "ONNX Runtime Web", "TypeScript", "React"],
    year: "2026",
    url: "https://canyoubeatchess.com",
    icon: "folder",
    detail: {
      blocks: [
        {
          kind: "paragraph",
          text:
            "One experiment, two deliverables: a website where visitors play the same " +
            "small neural network at five checkpoints of its training, and a research " +
            "paper measuring how playing strength develops with training compute. The " +
            "model is a small residual convolutional policy and value network distilled " +
            "from Stockfish evaluations, and it picks moves with no search tree at all.",
        },
        {
          kind: "video",
          src: "/projects/chess/arena.mp4",
          size: "medium",
          caption:
            "The arena. Any two checkpoints face each other, here the 5 minute machine against the 30 minute machine, with the full move list replaying live.",
        },
        {
          kind: "video",
          src: "/projects/chess/skills.mp4",
          size: "medium",
          caption:
            "The skills board. Every probe position the model has faced, from free captures to underpromotions, with each square coloured by whether that checkpoint solved it.",
        },
        {
          kind: "image",
          src: "/projects/chess/checkpoints.webp",
          alt: "The same endgame replayed side by side across five training checkpoints",
          size: "medium",
          caption:
            "One game replayed through all five checkpoints side by side. They disagree on the very first move.",
        },
        { kind: "heading", text: "How it works" },
        {
          kind: "bullets",
          items: [
            "Eight million positions sourced from Lichess games and labelled by Stockfish on cloud GPUs form the training set.",
            "The network reads the board directly and outputs a move and an evaluation, so its strength is pure learned intuition.",
            "Inference runs entirely in the visitor's browser via ONNX Runtime Web and WebAssembly SIMD, with p95 latency under 50ms on a midrange phone.",
            "A TypeScript board encoder is parity tested against the Python one in CI, so the browser model plays move for move identically to the training code.",
          ],
        },
      ],
    },
  },
  {
    slug: "oddssea",
    name: "OddsSea",
    blurb: "A social casino sim on a chain of tiny islands, where wagering funds an avatar cosmetic collection.",
    tech: ["AWS CDK", "AWS Lambda", "Cognito", "CloudFront", "S3", "Vite", "React", "TypeScript"],
    year: "2026",
    url: "https://oddssea.xyz",
    icon: "gamepad",
    detail: {
      blocks: [
        {
          kind: "paragraph",
          text:
            "A gambling simulator with no real money anywhere in the loop. Players earn " +
            "Shells through daily and weekly tasks, wager them across seven harbour " +
            "games, and spend the Pearls that wagering earns on an avatar cosmetic " +
            "collection, the economy's one sink.",
        },
        {
          kind: "image",
          src: "/projects/oddssea/harbour.webp",
          size: "medium",
          alt: "The OddsSea harbour map, with islands for games, tasks, shop and closet",
          caption: "The harbour. Each island is one part of the loop: games, tasks, shop and closet.",
        },
        {
          kind: "image",
          src: "/projects/oddssea/games.webp",
          size: "medium",
          alt: "The games archipelago with seven games spread across islands",
          caption: "Seven games at launch, from dice and roulette to a crash style slipway and a racer lagoon.",
        },
        {
          kind: "image",
          src: "/projects/oddssea/plinko.webp",
          size: "medium",
          alt: "The Plinko Falls game with risk tiers and a peg board",
          caption: "Plinko Falls, with selectable risk tiers and live multiplier plates.",
        },
        {
          kind: "image",
          src: "/projects/oddssea/noticeboard.webp",
          size: "small",
          alt: "The Harbour Noticeboard showing daily and weekly tasks",
          caption: "The Harbour Noticeboard, where daily and weekly tasks pay out Shells.",
        },
        { kind: "heading", text: "Under the hood" },
        {
          kind: "bullets",
          items: [
            "Two currencies in a closed loop: tasks pay Shells for wagering, wagering earns Pearls, and cosmetics drain them.",
            "Specs lead and code follows. Every rule and every number lives in a versioned spec tree with an append only decision log, and the economy is simulated in Python before anything ships.",
            "React and TypeScript client built with Vite, deployed on AWS with every piece of infrastructure defined in CDK.",
            "Compliance posture from day one: 18 plus, virtual currencies only, no path to real money.",
          ],
        },
      ],
    },
  },
];
