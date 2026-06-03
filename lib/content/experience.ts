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
    role: "Software Engineer Intern",
    company: "Grid Insights",
    start: "May 2025",
    end: "now",
    bullets: [
      "Complete SaaS Development.",
    ],
  },
  {
    role: "Software Developer",
    company: "Open Robotics",
    start: "September 2025",
    end: "now",
    bullets: [
      "Controls System Development.",
    ],
  },
  {
    role: "Supervisor & Coach",
    company: "Aylmer Soccer",
    start: "May 2023",
    end: "August 2024",
    bullets: [
      "Training Session Coordination & In-Game Management.", /////Flag this
    ],
  },
];
