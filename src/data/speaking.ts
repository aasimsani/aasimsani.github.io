// Each talk is the event, what kind of talk it was and when, and its topic.
export type Talk = {
  title: string;
  kind: string;
  topic: string;
  embed: { kind: "youtube" | "linkedin"; src: string };
};

export const speaking: Talk[] = [
  {
    title: "Junior Achievement Entrepreneurship Summit",
    kind: "Keynote · 2023",
    topic: "Unlocking Ambition: Lessons learned as a student entrepreneur",
    embed: { kind: "youtube", src: "https://www.youtube.com/embed/tY4NAHcRD0I" },
  },
  {
    title: "Cigna",
    kind: "Invited talk",
    topic: "Explaining artificial intelligence and how it impacts our professional lives",
    embed: { kind: "youtube", src: "https://www.youtube.com/embed/lyMfNN7sae4" },
  },
  {
    title: "Drexel Rising Starters’ Competition",
    kind: "Keynote · 2022",
    topic: "The mindset that got me from intern to co-founder",
    embed: {
      kind: "linkedin",
      src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7005391551757484032",
    },
  },
  {
    title: "Make Sense by Lindsay Tabas",
    kind: "Video podcast",
    topic: "Is AI getting worse?",
    embed: {
      kind: "youtube",
      src: "https://www.youtube.com/embed/kKtz5VS2sMA?si=oGNX9TzSFRsSuhqX",
    },
  },
];
