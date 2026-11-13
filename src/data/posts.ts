export interface Post {
  slug: string;
  title: string;
  description: string;
  published: string; // ISO date, used for sorting + article:published_time
  displayDate: string;
  readingTime: string;
  ogImage: string;
  /** Root-relative path of the narration MP3, which turns on the Listen bar. */
  audio?: string;
}

export const posts: Post[] = [
  // new-post:insert
  {
    slug: "process-as-a-plugin",
    title: "I Turned My Engineering Process Into a Plugin",
    description: "I wrote down how I build software and gave it to a coding agent as nine stages. Here is each stage, the specialist it calls, and what has and hasn't been tested.",
    published: "2026-11-13",
    displayDate: "November 13, 2026",
    readingTime: "16 min read",
    ogImage: "/images/blog/process-as-a-plugin-og.png",
  },
  {
    slug: "inattentional-blindness",
    title: "Your Startup Isn't Slow. It's Blind.",
    description:
      "Good engineers miss obvious things, and the misses quietly slow the roadmap. The psychology of inattentional blindness, a decade of case files, and the two-person structure that catches what one pair of eyes can't.",
    published: "2026-10-20",
    displayDate: "October 20, 2026",
    readingTime: "23 min read",
    ogImage: "/images/blog/inattentional-blindness-og.png?v=2",
    audio: "/audio/blog/inattentional-blindness.mp3",
  },
];
