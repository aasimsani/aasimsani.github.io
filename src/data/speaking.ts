export type Talk = {
  title: string;
  subtitle?: string;
  tagline: string;
  embed: { kind: "youtube" | "linkedin"; src: string };
};

export const speaking: Talk[] = [
  {
    title: "Keynote at Junior Achievement's",
    subtitle: " Entrepreneurship Summit",
    tagline: "Unlocking Ambition: Lessons learned as a student entrepreneur",
    embed: { kind: "youtube", src: "https://www.youtube.com/embed/tY4NAHcRD0I" },
  },
  {
    title: "Invited Talk",
    subtitle: "@ Cigna ",
    tagline:
      "Explaining artificial intelligence and how it impacts our professional lives",
    embed: { kind: "youtube", src: "https://www.youtube.com/embed/lyMfNN7sae4" },
  },
  {
    title: "Drexel Rising Starters' Competition Keynote",
    tagline: "The mindset that got me from intern to co-founder",
    embed: {
      kind: "linkedin",
      src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7005391551757484032",
    },
  },
  {
    title: "Is AI Getting Worse?",
    tagline:
      "Make Sense by Lindsay Tabas is a video podcast that simplifies complex issues at the intersection of tech & people.",
    embed: {
      kind: "youtube",
      src: "https://www.youtube.com/embed/kKtz5VS2sMA?si=oGNX9TzSFRsSuhqX",
    },
  },
];
