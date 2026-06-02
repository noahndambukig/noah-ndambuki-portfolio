// Work history shown by `experience`. Placeholder entries — edit freely.
export interface Experience {
  role: string;
  company: string;
  start: string;
  end: string; // e.g. "now"
  bullets: string[];
}

export const experience: Experience[] = [
  {
    role: "Software Engineer",
    company: "Grid Insights",
    start: "2024",
    end: "now",
    bullets: [
      "Placeholder: a high-impact thing you shipped here.",
      "Placeholder: a technology or scope highlight.",
    ],
  },
  {
    role: "Earlier Role",
    company: "Previous Company",
    start: "2022",
    end: "2024",
    bullets: ["Placeholder achievement.", "Placeholder responsibility."],
  },
];
